(ns akvo.lumen.lib.transformation
  (:refer-clojure :exclude [apply])
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [clojure.tools.logging :as log]
            [akvo.lumen.util :refer (squuid)]
            [clojure.java.jdbc :as jdbc]))

(def transformation-namespaces
  '[akvo.lumen.lib.transformation.change-datatype
    akvo.lumen.lib.transformation.derive-category
    akvo.lumen.lib.transformation.text
    akvo.lumen.lib.transformation.sort-column
    akvo.lumen.lib.transformation.split-column
    akvo.lumen.lib.transformation.filter-column
    akvo.lumen.lib.transformation.combine
    akvo.lumen.lib.transformation.derive
    akvo.lumen.lib.transformation.rename-column
    akvo.lumen.lib.transformation.delete-column
    akvo.lumen.lib.transformation.geo
    akvo.lumen.lib.transformation.merge-datasets
    akvo.lumen.lib.transformation.multiple-column
    akvo.lumen.lib.transformation.reverse-geocode])

;; Load transformation namespaces
(clojure.core/apply require transformation-namespaces)

(defn validate
  [command]
  (try
    (condp = (:type command)
      :transformation (if (engine/valid? (:transformation command))
                        {:valid? true}
                        {:valid? false
                         :message (str "Invalid transformation " (:transformation command))})
      :undo {:valid? true}
      {:valid? false
       :message (str "Unknown command " command)})
    (catch Exception e
      {:valid? false
       :message (.getMessage e)})))

(defn- execute-tx [{:keys [tenant-conn] :as deps} job-execution-id dataset-id command]
  (future
    (try
      (jdbc/with-db-transaction [tx-conn tenant-conn]
        (let [tx-deps (assoc deps :tenant-conn tx-conn)]
          (condp = (:type command)
            :transformation (engine/execute-transformation tx-deps dataset-id job-execution-id (:transformation command))
            :undo (engine/execute-undo tx-deps dataset-id job-execution-id)))
        (db.job-execution/update-successful-job-execution tx-conn {:id job-execution-id}))
      (let [dsv (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})]
        (db.job-execution/vacuum-table tenant-conn (select-keys dsv [:table-name])))
      (catch Exception e
        (let [msg (.getMessage e)]
          (engine/log-ex e)
          (db.job-execution/update-failed-job-execution tenant-conn {:id job-execution-id :reason [msg]})
          (lib/conflict {:jobExecutionId job-execution-id :datasetId dataset-id :message msg}))))))

(defn apply
  [{:keys [tenant-conn] :as deps} dataset-id command]
  (if-let [current-tx-job (db.transformation/pending-tx-or-update-job-execution tenant-conn {:dataset-id dataset-id})]
    (lib/bad-request {:message (format "A running %s still exists, please wait to apply more ..." (:type current-tx-job))})
    (if-let [dataset (db.transformation/dataset-by-id tenant-conn {:id dataset-id})]
      (let [v (validate command)]
        (if-not (:valid? v)
          (lib/bad-request {:message (:message v)})
          (let [job-execution-id (str (squuid))]
            (db.transformation/new-transformation-job-execution tenant-conn {:id job-execution-id :dataset-id dataset-id})
            (execute-tx deps job-execution-id dataset-id command)
            (lib/ok {:jobExecutionId job-execution-id
                     :datasetId dataset-id}))))
      (lib/bad-request {:message "Dataset not found"}))))
