(ns akvo.lumen.lib.update
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.data :as d]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [clojure.tools.logging :as log]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [clojure.walk :as walk]))

(defn- undif-columns [tx columns]
  (let [columns (reduce #(assoc % (:columnName %2) %2) {} columns)
        cc (->> tx :changedColumns vals)
        res (reduce (fn [c {:keys [before after]}]
                      (if after
                        (assoc c (:columnName after) after)
                        (dissoc c (:columnName before))))
                    columns cc)]
    (vals res)))

(defn- columns-used-in-txs [importer-type initial-dataset-version latest-dataset-version]
  (if (contains? #{"LINK" "CSV"} importer-type)
    (set (-> initial-dataset-version :columns))
    (loop [columns (-> initial-dataset-version :columns walk/keywordize-keys)
           txs (-> latest-dataset-version :transformations walk/keywordize-keys)
           counter 1
           cols0 #{}]
      (let [tx (first txs)
            cols1 (apply conj cols0 (try
                                      (when-not (engine/avoidable-if-missing? tx)
                                        (engine/columns-used tx columns))
                                      (catch Throwable e
                                        (if-let [ex-d (ex-data e)]
                                          (throw (ex-info (format "Transformation '%s' failed. %s" counter (.getMessage e)) 
                                                          ex-d))
                                          (throw e)))))]
        (if-let [txs (seq (next txs))]
          (recur (undif-columns tx columns) txs (inc counter) cols1)
          cols1)))))

(defn- successful-update
  "On a successful update we need to create a new dataset-version that
  is similar to the previous one, except with an updated :version and
  pointing to the new table-name, imported-table-name and columns. We
  also delete the previous table-name and imported-table-name so we
  don't accumulate unused datasets on each update."
  [tenant-conn job-execution-id dataset-id table-name imported-table-name old-dataset-version columns transformations]
  (jdbc/with-db-transaction [conn tenant-conn]
    (db.dataset-version/new-dataset-version conn {:id                  (str (util/squuid))
                                                  :dataset-id          dataset-id
                                                  :job-execution-id    job-execution-id
                                                  :table-name          table-name
                                                  :imported-table-name imported-table-name
                                                  :version             (inc (:version old-dataset-version))
                                                  :columns             columns
                                                  :transformations     transformations})
    (db.transformation/touch-dataset conn {:id dataset-id})
    (db.job-execution/update-successful-job-execution conn {:id job-execution-id})
    (db.transformation/drop-table tenant-conn {:table-name (:imported-table-name old-dataset-version)})
    (db.transformation/drop-table tenant-conn {:table-name (:table-name old-dataset-version)})))

(defn- failed-update [conn job-execution-id reason]
  (db.job-execution/update-failed-job-execution conn {:id job-execution-id
                                                      :reason [reason]}))

(defn compatible-columns-errors [dict imported-columns columns]
  (let [diff (d/diff imported-columns columns)
        diff-indexed (map (partial conj []) (range) (first diff))

        f0 (vec (filter (comp some? :id last)  diff-indexed))

        columns-id-problems (mapv (fn [[idx _]]
                                    (let [c (nth imported-columns idx nil)]
                                      {:title (get dict (:id c))
                                       :id (:id c)})) f0)
        idxs (set (map first f0))
        f1 (vec (->> diff-indexed
                     (filter (comp some? :type last))
                     (filter #((complement contains?) idxs (first %)))))

        column-types-problems (mapv (fn [[idx _]]
                                      (let [c (nth imported-columns idx nil)]
                                        {:title (get dict (:id c))
                                         :id (:id c)
                                         :imported-type (:type (nth (first diff) idx nil))
                                         :updated-type (:type (nth (second diff) idx nil))})) f1)]
    {:wrong-types column-types-problems :missed-columns columns-id-problems}))

(defn compatible-columns-error? [imported-columns* columns]
  (let [imported-columns (->> imported-columns*
                              (map (fn [column]
                                     (cond-> {:id (get column "columnName")
                                              :type (get column "type")}
                                       (contains? column "key") (assoc :key (boolean (get column "key")))))
                                   )
                              (mapv #(select-keys % [:id :type])))
        columns (->> columns
                     (mapv #(select-keys % [:id :type])
                           ;; https://github.com/akvo/akvo-lumen/issues/1923
                           ;; https://github.com/akvo/akvo-lumen/issues/1926
                           ;; remove this map conversion logic once #1926 is finished
                           ))
        columns-dict (reduce (fn [c x] (assoc c (:id x) x)) {} columns)
        imported-columns (map (fn [{:keys [id type] :as x}]
                                (if (and (= type "text")
                                         (= "geoshape" (-> (get columns-dict id) :type)))
                                  (assoc x :type "geoshape")
                                  x)) imported-columns)
        compatible? (set/subset? (set imported-columns) (set columns))]
    (if-not compatible?
      (do
        (log/warn :compatible-columns-errors :imported-columns imported-columns  :columns columns (d/diff imported-columns columns))
        (compatible-columns-errors (reduce (fn [c e] (assoc c (get e "columnName")
                                                            (get e "title") )) {} imported-columns*)
                                   imported-columns
                                   columns))
      nil)))

(defn- import-data-to-table [tenant-conn import-config dataset-id job-execution-id data-source-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [environment (env/all conn)]
      (with-open [importer (import/dataset-importer (get data-source-spec "source")
                                                    (assoc import-config :environment environment))]
        (let [initial-dataset-version  (db.transformation/initial-dataset-version-to-update-by-dataset-id conn {:dataset-id dataset-id})
              latest-dataset-version (db.transformation/latest-dataset-version-by-dataset-id conn {:dataset-id dataset-id})
              imported-dataset-columns (vec (:columns initial-dataset-version))
              importer-columns         (p/columns importer)

              columns-used (columns-used-in-txs
                            (import/importer-type (get data-source-spec "source"))
                            initial-dataset-version
                            latest-dataset-version)
              imported-dataset-columns-checked (reduce (fn [c co]
                                                         (if (contains? columns-used (get co "columnName"))
                                                           (conj c co)
                                                           c)) [] imported-dataset-columns)]
          (if-let [compatible-errors (compatible-columns-error? imported-dataset-columns-checked
                                                                (if (get environment "optionColumnType")
                                                                  (map #(update % :type (fn [t]
                                                                                          (if (= "option" t) "text" t)))
                                                                       importer-columns)
                                                                  importer-columns))]
            (do
              (failed-update conn job-execution-id
                             (cond-> "Column mismatch"
                               (seq (:missed-columns compatible-errors))
                               (str ".\n Following columns are missed in new data version: " (:missed-columns compatible-errors))
                               (seq (:wrong-types compatible-errors))
                               (str ".\n Following columns have changed the column type in new data version: " (:wrong-types compatible-errors))))
              {:success? false})
            (let [table-name          (util/gen-table-name "ds")
                  imported-table-name (util/gen-table-name "imported")]
              (postgres/create-dataset-table conn table-name importer-columns)
              (doseq [record (map (comp postgres/coerce-to-sql import/extract-first-and-merge) (p/records importer))]
                (jdbc/insert! conn table-name record))
              (db.job-execution/clone-data-table conn {:from-table table-name
                                                       :to-table   imported-table-name}
                                                 {}
                                                 {:transaction? false})
              (let [coerce-column-fn (fn [{:keys [title id type key multipleId multipleType groupName groupId] :as column}]
                                       (cond-> {"type" type
                                                "title" title
                                                "columnName" id
                                                "groupName" groupName
                                                "groupId" groupId
                                                "sort" nil
                                                "direction" nil
                                                "hidden" false}
                                         key           (assoc "key" (boolean key))
                                         multipleType (assoc "multipleType" multipleType)
                                         multipleId   (assoc "multipleId" multipleId)))]
                {:success? true
                 :table-name table-name :imported-table-name imported-table-name
                 :importer-columns (mapv coerce-column-fn importer-columns) :imported-dataset-columns imported-dataset-columns
                 :latest-dataset-version latest-dataset-version}))))))))

(defn update-dataset [tenant-conn caddisfly import-config error-tracker dataset-id data-source-id data-source-spec]
  (if-let [current-tx-job (db.transformation/pending-transformation-job-execution tenant-conn {:dataset-id dataset-id})]
    (lib/bad-request {:message "A running transformation still exists, please wait to update this dataset ..."})
    (let [job-execution-id (str (util/squuid))]
     (db.job-execution/insert-dataset-update-job-execution tenant-conn {:id job-execution-id
                                                                        :data-source-id data-source-id
                                                                        :dataset-id dataset-id})
     (future
       (try
         (let [{:keys [table-name imported-table-name
                       importer-columns imported-dataset-columns
                       latest-dataset-version success?]}  (import-data-to-table tenant-conn
                                                                                import-config
                                                                                dataset-id
                                                                                job-execution-id
                                                                                data-source-spec)]
           (when success?
             (let [{:keys [columns transformations]} (engine/apply-dataset-transformations-on-table tenant-conn
                                                                                                    caddisfly
                                                                                                    dataset-id
                                                                                                    (:transformations latest-dataset-version)
                                                                                                    table-name
                                                                                                    importer-columns
                                                                                                    imported-dataset-columns)]
               (successful-update tenant-conn job-execution-id dataset-id table-name imported-table-name latest-dataset-version columns transformations))))
         (catch Exception e
           (failed-update tenant-conn job-execution-id (.getMessage e))
           (p/track error-tracker e)
           (log/error e))))
     (lib/ok {"updateId" job-execution-id}))))
