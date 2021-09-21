(ns akvo.lumen.lib.update
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.lib.data-group :as lib.data-group]
            [akvo.lumen.lib.import.data-groups :as import.data-groups]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.data :as d]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [clojure.tools.logging :as log]
            [akvo.lumen.db.data-group :as db.data-group]
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
                                        (flatten (engine/columns-used tx columns)))
                                      (catch Throwable e
                                        (if-let [ex-d (ex-data e)]
                                          (throw (ex-info (format "Transformation '%s' failed. %s" counter (.getMessage e))
                                                          ex-d))
                                          (throw e)))))]
        (if-let [txs (seq (next txs))]
          (recur (undif-columns tx columns) txs (inc counter) cols1)
          cols1)))))

(defn- successful-update-2
  "On a successful update we need to create a new dataset-version that
  is similar to the previous one, except with an updated :version and
  pointing to the new table-name, imported-table-name and columns. We
  also delete the previous table-name and imported-table-name so we
  don't accumulate unused datasets on each update."
  [tenant-conn claims job-execution-id dataset-id data-groups old-dataset-version transformations]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [new-dataset-version-id (str (util/squuid))]
      (db.dataset-version/new-dataset-version-2 conn {:id               new-dataset-version-id
                                                      :dataset-id       dataset-id
                                                      :job-execution-id job-execution-id
                                                      :author           claims
                                                      :version          (inc (:version old-dataset-version))
                                                      :transformations  transformations})
      (doseq [dg data-groups]
        (let [columns (vec (:columns dg))]
          (db.data-group/new-data-group conn
                                        (merge
                                         (select-keys dg
                                                      [:table-name :group-id :group-name :group-order :repeatable])
                                         {:id                 (util/squuid)
                                          :dataset-version-id new-dataset-version-id
                                          :repeatable (boolean (get (first columns) "repeatable"))
                                          :imported-table-name (util/table-name-to-imported (:table-name dg))
                                          :columns            columns})))))
    (doseq [old-dg (db.data-group/list-data-groups-by-dataset-version-id
                    conn
                    {:dataset-version-id (:id old-dataset-version)})]
      (db.transformation/drop-table conn {:table-name (:imported-table-name old-dg)})
      (db.transformation/drop-table conn {:table-name (:table-name old-dg)}))
    (db.transformation/touch-dataset conn {:id dataset-id})
    (db.job-execution/update-successful-job-execution conn {:id job-execution-id})))

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
                                (cond
                                  (and (= type "text")
                                       (= "geoshape" (-> (get columns-dict id) :type))) (assoc x :type "geoshape")
                                  (and (= type "text")
                                       (= "option" (-> (get columns-dict id) :type))) (assoc x :type "option")
                                  :else x)) imported-columns)
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
                                                                importer-columns)]
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

(defn- import-data-to-table-2 [tenant-conn import-config dataset-id job-execution-id data-source-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [environment (env/all conn)]
      (with-open [importer (import/datagroups-importer (get data-source-spec "source")
                                                       (assoc import-config :environment environment))]
        (let [initial-dataset-version  (let [dsv (db.transformation/initial-dataset-version-2-to-update-by-dataset-id conn {:dataset-id dataset-id})]
                                         (assoc dsv :columns (db.data-group/get-all-columns conn {:dataset-version-id (:id dsv)})))
              latest-dataset-version (let [dsv (db.transformation/latest-dataset-version-2-by-dataset-id conn {:dataset-id dataset-id})]
                                       (assoc dsv :columns (db.data-group/get-all-columns conn {:dataset-version-id (:id dsv)})))
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
                                                                importer-columns)]
            (do
              (failed-update conn job-execution-id
                             (cond-> "Column mismatch"
                               (seq (:missed-columns compatible-errors))
                               (str ".\n Following columns are missed in new data version: " (:missed-columns compatible-errors))
                               (seq (:wrong-types compatible-errors))
                               (str ".\n Following columns have changed the column type in new data version: " (:wrong-types compatible-errors))))
              {:success? false})
            (let [{:keys [columns group-table-names]} (import.data-groups/adapt-columns importer-columns)]
              (doseq [[groupId cols] (group-by :groupId columns)]
                (postgres/create-dataset-table conn (get group-table-names groupId) cols))
              (doseq [response (take import/rows-limit (p/records importer))]
                (doseq [[groupId iterations] response]
                  (let [table-name (get group-table-names groupId)]
                    (jdbc/insert-multi! conn table-name (mapv postgres/coerce-to-sql iterations)))))
              (doseq [[groupId cols] (group-by :groupId columns)]
                (let [table-name (get group-table-names groupId)]
                  (db.job-execution/clone-data-table conn {:from-table table-name
                                                           :to-table (util/table-name-to-imported table-name)}
                                                     {}
                                                     {:transaction? false})))
              (let [coerce-column-fn (fn [{:keys [title id hidden repeatable type key multipleId multipleType groupName groupId] :as column}]
                                       (cond-> {"type" type
                                                "title" title
                                                "columnName" id
                                                "groupName" groupName
                                                "groupId" groupId
                                                "repeatable" (boolean repeatable)
                                                "sort" nil
                                                "direction" nil
                                                "hidden" (boolean hidden)}
                                         key           (assoc "key" (boolean key))
                                         multipleType (assoc "multipleType" multipleType)
                                         multipleId   (assoc "multipleId" multipleId)))]
                {:success? true
                 :group-table-names group-table-names
                 :importer-columns (mapv coerce-column-fn columns)
                 :imported-dataset-columns imported-dataset-columns
                 :latest-dataset-version latest-dataset-version}))))))))

(defn update-dataset [tenant-conn caddisfly claims import-config error-tracker dataset-id data-source-id data-source-spec]
  (if-let [current-tx-job (db.transformation/pending-transformation-job-execution tenant-conn {:dataset-id dataset-id})]
    (lib/bad-request {:message "A running transformation still exists, please wait to update this dataset ..."})
    (let [job-execution-id (str (util/squuid))]
     (db.job-execution/insert-dataset-update-job-execution tenant-conn {:id job-execution-id
                                                                        :data-source-id data-source-id
                                                                        :dataset-id dataset-id})
     (future
       (try
         (if (get (env/all tenant-conn) "data-groups")
           (let [dsv1 (:id (db.dataset-version/latest-dataset-version-2-by-dataset-id tenant-conn {:dataset-id dataset-id}))
                 _ (lib.data-group/drop-view! tenant-conn dsv1)
                 _ (lib.data-group/drop-persisted-views! tenant-conn dsv1)
                 {:keys [group-table-names
                         importer-columns imported-dataset-columns
                         latest-dataset-version success?]} (import-data-to-table-2 tenant-conn
                                                                                   import-config
                                                                                   dataset-id
                                                                                   job-execution-id
                                                                                   data-source-spec)]
             (let [{:keys [data-groups transformations]}
                   (engine/apply-dataset-transformations-on-table-2 tenant-conn
                                                                    caddisfly
                                                                    dataset-id
                                                                    (:transformations latest-dataset-version)
                                                                    group-table-names
                                                                    importer-columns
                                                                    imported-dataset-columns)]
               (successful-update-2 tenant-conn claims job-execution-id dataset-id data-groups latest-dataset-version transformations)))
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
                 (successful-update tenant-conn job-execution-id dataset-id table-name imported-table-name latest-dataset-version columns transformations)
                 (lib.data-group/create-view-from-data-groups tenant-conn dataset-id)))))
         (catch Exception e
           (failed-update tenant-conn job-execution-id (.getMessage e))
           (p/track error-tracker e)
           (log/error e))))
     (lib/ok {"updateId" job-execution-id}))))
