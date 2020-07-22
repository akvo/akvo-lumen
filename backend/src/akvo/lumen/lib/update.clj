(ns akvo.lumen.lib.update
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.data :as d]
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
  [conn job-execution-id dataset-id]
  (db.transformation/touch-dataset conn {:id dataset-id})
  (db.job-execution/update-successful-job-execution conn {:id job-execution-id}))

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

(defn- compatible-errors-logic [tenant-conn data-source-spec dataset-id initial-dataset-version-col importer-columns]
  (first
   (filter some? (map #(let [imported-dataset-columns (vec (:columns %))

                             columns-used (columns-used-in-txs
                                           (import/importer-type (get data-source-spec "source"))
                                           %
                                           (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id}))

                             imported-dataset-columns-checked (reduce (fn [c co]
                                                                        (if (contains? columns-used (get co "columnName"))
                                                                          (conj c co)
                                                                          c)) [] imported-dataset-columns)
                             ]
                         (compatible-columns-error? imported-dataset-columns-checked importer-columns))
                      initial-dataset-version-col)))
  )

(defn- coerce-column [{:keys [title id type key multipleId multipleType groupName groupId ns] :as column}]
  (cond-> {"type" type
           "title" title
           "columnName" id
           "groupName" groupName
           "groupId" groupId
           "ns" ns
           "sort" nil
           "direction" nil
           "hidden" false}
    key           (assoc "key" (boolean key))
    multipleType (assoc "multipleType" multipleType)
    multipleId   (assoc "multipleId" multipleId)))

(defn dict-dsv [initial-dataset-version-col latest-dataset-version-col]
  (let [res (reduce (fn [c ds] (update c (get (first (:columns ds)) "ns" "main") conj ds)) {} latest-dataset-version-col)
        res1 (reduce (fn [c ds] (update c (get (first (:columns ds)) "ns" "main") conj ds)) res initial-dataset-version-col)]
    res1))

(defn- do-update [tenant-conn caddisfly import-config dataset-id data-source-id job-execution-id data-source-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (with-open [importer (import/dataset-importer (get data-source-spec "source") import-config)]
      (let [version (:version (db.transformation/initial-dataset-version-to-update-by-dataset-id conn {:dataset-id dataset-id}))
            initial-dataset-version-col  (db.transformation/initial-dataset-versions-to-update-by-dataset-id conn {:dataset-id dataset-id :version version})
            importer-columns         (p/columns importer)
            columns-by-ns (map  (fn [c] (update c :ns (fn [ns] (or ns "main")))) (p/columns importer))
            grouped-columns-by-ns (group-by :ns columns-by-ns)
            ns-table-names (reduce #(assoc % %2 (util/gen-table-name "ds")) {} (distinct (map :ns columns-by-ns)))]
        (if-let [compatible-errors (compatible-errors-logic tenant-conn data-source-spec dataset-id initial-dataset-version-col importer-columns)]
          (failed-update conn job-execution-id
                         (cond-> "Column mismatch"
                           (seq (:missed-columns compatible-errors))
                           (str ".\n Following columns are missed in new data version: " (:missed-columns compatible-errors))
                           (seq (:wrong-types compatible-errors))
                           (str ".\n Following columns have changed the column type in new data version: " (:wrong-types compatible-errors))))
          (let [latest-version  (:version (db.transformation/latest-dataset-version-by-dataset-id conn {:dataset-id dataset-id}))
                latest-dataset-version-col (db.transformation/latest-dataset-versions-by-dataset-id conn {:dataset-id dataset-id :version latest-version})
                dataset-version-col-by-ns (dict-dsv initial-dataset-version-col latest-dataset-version-col)]
            (doseq [[ns* cols] grouped-columns-by-ns]
             ;; todo foreign references????
              (postgres/create-dataset-table conn (get ns-table-names ns*) cols))

            (doseq [record-groups (take common/rows-limit (p/records importer))]
              (doseq [record record-groups]
                (jdbc/insert! conn (get ns-table-names (:ns (meta record) "main"))
                              (postgres/coerce-to-sql record))))
            
            (doseq [[ns* [initial-dataset-version latest-dataset-version]] dataset-version-col-by-ns]
              (let [imported-table-name (util/gen-table-name "imported")
                    table-name (get ns-table-names ns*)]
                (db.job-execution/clone-data-table conn {:from-table table-name
                                                         :to-table   imported-table-name}
                                                   {}
                                                   {:transaction? false})
                (engine/apply-transformation-log conn
                                                 caddisfly
                                                 table-name
                                                 imported-table-name
                                                 (mapv coerce-column (get grouped-columns-by-ns ns*))
                                                 (vec (:columns initial-dataset-version))
                                                 dataset-id
                                                 job-execution-id
                                                 initial-dataset-version
                                                 latest-dataset-version)
                (db.transformation/drop-table conn {:table-name (:imported-table-name latest-dataset-version)})
                (db.transformation/drop-table conn {:table-name (:table-name latest-dataset-version)})))
            (successful-update conn job-execution-id dataset-id)))))))

(defn update-dataset [tenant-conn caddisfly import-config error-tracker dataset-id data-source-id data-source-spec]
  (if-let [current-tx-job (db.transformation/pending-transformation-job-execution tenant-conn {:dataset-id dataset-id})]
    (lib/bad-request {:message "A running transformation still exists, please wait to update this dataset ..."})
    (let [job-execution-id (str (util/squuid))]
     (db.job-execution/insert-dataset-update-job-execution tenant-conn {:id job-execution-id
                                                       :data-source-id data-source-id
                                                       :dataset-id dataset-id})
     (future
       (try
         (do-update tenant-conn
                    caddisfly
                    import-config
                    dataset-id
                    data-source-id
                    job-execution-id
                    data-source-spec)
         (catch Exception e
           (failed-update tenant-conn job-execution-id (.getMessage e))
           (p/track error-tracker e)
           (log/error e))))
     (lib/ok {"updateId" job-execution-id}))))
