(ns akvo.lumen.lib.update
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.data :as d]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn- successful-update
  "On a successful update we need to create a new dataset-version that
  is similar to the previous one, except with an updated :version and
  pointing to the new table-name, imported-table-name and columns. We
  also delete the previous table-name and imported-table-name so we
  don't accumulate unused datasets on each update."
  [conn job-execution-id dataset-id table-name imported-table-name dataset-version]
  (touch-dataset conn {:id dataset-id})
  (drop-table conn {:table-name (:imported-table-name dataset-version)})
  (drop-table conn {:table-name (:table-name dataset-version)})
  (update-successful-job-execution conn {:id job-execution-id}))

(defn- failed-update [conn job-execution-id reason]
  (update-failed-job-execution conn {:id job-execution-id
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
                     (map #(update % :id name))
                     (mapv #(select-keys % [:id :type])
                       ;; https://github.com/akvo/akvo-lumen/issues/1923
                       ;; https://github.com/akvo/akvo-lumen/issues/1926
                       ;; remove this map conversion logic once #1926 is finished
                           ))
        compatible? (set/subset? (set imported-columns) (set columns))]
    (if-not compatible?
      (do
        (log/warn :compatible-columns-errors :imported-columns imported-columns  :columns columns (d/diff imported-columns columns))
        (compatible-columns-errors (reduce (fn [c e] (assoc c (get e "columnName")
                                                            (get e "title") )) {} imported-columns*)
                                   imported-columns
                                   columns))
      nil)))

(defn- do-update [tenant-conn import-config dataset-id data-source-id job-execution-id data-source-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (with-open [importer (import/dataset-importer (get data-source-spec "source") import-config)]
      (let [initial-dataset-version  (initial-dataset-version-to-update-by-dataset-id conn {:dataset-id dataset-id})
            imported-dataset-columns (vec (:columns initial-dataset-version))
            importer-columns         (p/columns importer)]
        (if-let [compatible-errors (compatible-columns-error? imported-dataset-columns importer-columns)]
          (failed-update conn job-execution-id
                         (cond-> "Column mismatch"
                           (seq (:missed-columns compatible-errors))
                           (str ".\n Following columns are missed in new data version: " (:missed-columns compatible-errors))
                           (seq (:wrong-types compatible-errors))
                           (str ".\n Following columns have changed the column type in new data version: " (:wrong-types compatible-errors))))
          (let [table-name          (util/gen-table-name "ds")
                imported-table-name (util/gen-table-name "imported")]
            (postgres/create-dataset-table conn table-name importer-columns)
            (doseq [record (map postgres/coerce-to-sql (p/records importer))]
              (jdbc/insert! conn table-name record))
            (clone-data-table conn {:from-table table-name
                                    :to-table   imported-table-name}
                              {}
                              {:transaction? false})
            (let [dataset-version  (latest-dataset-version-by-dataset-id conn {:dataset-id dataset-id})
                  coerce-column-fn (fn [{:keys [title id type key multipleId multipleType] :as column}]
                                     (cond-> {"type" (name type)
                                              "title" title
                                              "columnName" (name id)
                                              "sort" nil
                                              "direction" nil
                                              "hidden" false}
                                       key           (assoc "key" (boolean key))
                                       multipleType (assoc "multipleType" multipleType)
                                       multipleId   (assoc "multipleId" multipleId)))
                  importer-columns (mapv coerce-column-fn importer-columns)]
              (engine/apply-transformation-log conn
                                               table-name
                                               imported-table-name
                                               importer-columns
                                               imported-dataset-columns
                                               dataset-id
                                               job-execution-id
                                               dataset-version)
              (successful-update conn
                                 job-execution-id
                                 dataset-id
                                 table-name
                                 imported-table-name
                                 dataset-version))))))))

(defn update-dataset [tenant-conn import-config error-tracker dataset-id data-source-id data-source-spec]
  (if-let [current-tx-job (pending-transformation-job-execution tenant-conn {:dataset-id dataset-id})]
    (lib/bad-request {:message "A running transformation still exists, please wait to update this dataset ..."})
    (let [job-execution-id (str (util/squuid))]
     (insert-dataset-update-job-execution tenant-conn {:id job-execution-id
                                                       :data-source-id data-source-id})
     (future
       (try
         (do-update tenant-conn
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
