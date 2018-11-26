(ns akvo.lumen.update
  (:require [akvo.lumen.boundary.error-tracker :as error-tracker]
            [akvo.lumen.import.common :as import]
            [akvo.lumen.import.csv]
            [akvo.lumen.import.flow]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/dataset.sql")

(defmulti adapt-transformation
  (fn [op-spec older-columns new-columns]
    (keyword (get op-spec "op"))))

(defmethod adapt-transformation :default
  [op-spec older-columns new-columns]
  op-spec)

(defn successful-update
  "On a successful update we need to create a new dataset-version that
  is similar to the previous one, except with an updated :version and
  pointing to the new table-name, imported-table-name and columns. We
  also delete the previous table-name and imported-table-name so we
  don't accumulate unused datasets on each update."
  [conn job-execution-id dataset-id table-name imported-table-name dataset-version
   transformations new-columns]
  (insert-dataset-version conn {:id (str (util/squuid))
                                :dataset-id dataset-id
                                :job-execution-id job-execution-id
                                :table-name table-name
                                :imported-table-name imported-table-name
                                :version (inc (:version dataset-version))
                                :columns new-columns
                                :transformations (vec transformations)})
  (touch-dataset conn {:id dataset-id})
  (drop-table conn {:table-name (:imported-table-name dataset-version)})
  (drop-table conn {:table-name (:table-name dataset-version)})
  (update-successful-job-execution conn {:id job-execution-id}))

(defn failed-update [conn job-execution-id reason]
  (update-failed-job-execution conn {:id job-execution-id
                                     :reason [reason]}))

(defn- apply-transformation-log [conn table-name importer-columns original-dataset-columns last-transformations dataset-id version]
  (let [importer-columns (mapv (fn [{:keys [title id type key caddisflyResourceUuid
                                            multiple-id multiple-type] :as column}]
                                 (cond-> {"type" (name type)
                                          "title" title
                                          "columnName" (name id)
                                          "sort" nil
                                          "direction" nil
                                          "hidden" false}
                                   key                   (assoc "key" (boolean key))
                                   caddisflyResourceUuid (assoc "caddisflyResourceUuid" caddisflyResourceUuid)
                                   multiple-type (assoc "multipleType" multiple-type)
                                   multiple-id (assoc "multipleId" multiple-id)))
                               importer-columns)]
    (update-dataset-version conn {:dataset-id      dataset-id
                                  :version         version
                                  :columns         importer-columns
                                  :transformations []})
    (loop [transformations  last-transformations
           importer-columns importer-columns
           version          (inc version)
           applied-txs      []]
      (if-let [transformation (first transformations)]
        (let [transformation                     (adapt-transformation transformation original-dataset-columns importer-columns)
              {:keys [success? message columns]} (engine/try-apply-operation
                                                  {:tenant-conn conn} table-name importer-columns transformation)]
          (when-not success? (throw
                              (ex-info (format "Failed to update due to transformation mismatch: %s" message) {})))
          (let [applied-txs (conj applied-txs
                                  (assoc transformation "changedColumns"
                                         (engine/diff-columns importer-columns columns)))]
            (update-dataset-version conn {:dataset-id      dataset-id
                                          :version         version
                                          :columns         columns
                                          :transformations applied-txs})
            (recur (rest transformations) columns (inc version) applied-txs)))
        [importer-columns applied-txs]))))

(defn compatible-columns? [imported-columns columns]
  (let [imported-columns (map (fn [column]
                                (cond-> {:id (keyword (get column "columnName"))
                                         :type (keyword (get column "type"))}
                                  (contains? column "key") (assoc :key (boolean (get column "key")))))
                              imported-columns)]
    (set/subset? (set (map #(select-keys % [:id :type]) imported-columns))
                 (set (map #(select-keys % [:id :type]) columns)))))

(defn do-update [conn config dataset-id data-source-id job-execution-id data-source-spec]
  (let [table-name (util/gen-table-name "ds")
        imported-table-name (util/gen-table-name "imported")
        dataset-version (latest-dataset-version-by-dataset-id conn {:dataset-id dataset-id})
        initial-dataset-version (initial-dataset-version-to-update-by-dataset-id conn {:dataset-id dataset-id})
        imported-dataset-columns (vec (:columns initial-dataset-version))]
    (with-open [importer (import/dataset-importer (get data-source-spec "source") config)]
      (let [importer-columns (import/columns importer)]
        (if-not (compatible-columns? imported-dataset-columns importer-columns)
          (failed-update conn job-execution-id "Column mismatch")
          (do (import/create-dataset-table conn table-name importer-columns)
              (import/add-key-constraints conn table-name importer-columns)
              (doseq [record (map import/coerce-to-sql (import/records importer))]
                (jdbc/insert! conn table-name record))
              (clone-data-table conn
                                {:from-table table-name
                                 :to-table imported-table-name}
                                {}
                                {:transaction? false})
              (let [[columns transformations]
                    (apply-transformation-log conn table-name importer-columns imported-dataset-columns
                                              (:transformations dataset-version)
                                              dataset-id
                                              (:version initial-dataset-version))]
                (successful-update conn
                                   job-execution-id
                                   dataset-id
                                   table-name
                                   imported-table-name
                                   dataset-version
                                   transformations
                                   columns))))))))

(defn update-dataset [tenant-conn config error-tracker dataset-id data-source-id data-source-spec]
  (let [job-execution-id (str (util/squuid))]
    (insert-dataset-update-job-execution tenant-conn {:id job-execution-id
                                                      :data-source-id data-source-id})
    (future
      (try
        (jdbc/with-db-transaction [tx-conn tenant-conn]
          (do-update tx-conn
                     config
                     dataset-id
                     data-source-id
                     job-execution-id
                     data-source-spec))
        (catch Exception e
          (failed-update tenant-conn job-execution-id (.getMessage e))
          (error-tracker/track error-tracker e)
          (log/error e))))
    (lib/ok {"updateId" job-execution-id})))
