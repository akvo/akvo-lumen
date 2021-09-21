(ns akvo.lumen.lib.transformation
  (:refer-clojure :exclude [apply])
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.persisted-view :as db.persisted-view]
            [akvo.lumen.lib.data-group :as lib.data-group]
            [akvo.lumen.lib.env :as env]
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
        (let [dsv1 (db.dataset-version/latest-dataset-version-2-by-dataset-id tx-conn {:dataset-id dataset-id})]
         (let [tx-deps (assoc deps :tenant-conn tx-conn)]
           (condp = (:type command)
             :transformation (engine/execute-transformation tx-deps dataset-id job-execution-id (:transformation command))
             :undo (engine/execute-undo tx-deps dataset-id job-execution-id)))
         (db.job-execution/update-successful-job-execution tx-conn {:id job-execution-id})
         (when (get (env/all tx-conn) "data-groups")
           (let [dsv2 (db.transformation/latest-dataset-version-by-dataset-id tx-conn {:dataset-id dataset-id})]
             (lib.data-group/create-view-from-data-groups dataset-id tx-conn dataset-id)
             (lib.data-group/move-persisted-view tx-conn (:id dsv1) (:id dsv2))))))
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
            (when (get (env/all tenant-conn) "data-groups")
              (let [dsv-id (:id (db.dataset-version/latest-dataset-version-2-by-dataset-id tenant-conn {:dataset-id dataset-id}))]
                (lib.data-group/drop-view! tenant-conn dsv-id)
                (mapv (fn [v]
                        (lib.data-group/drop-view! tenant-conn (:visualisation-id v)))
                      (db.persisted-view/get-persisted-views-by-dsv tenant-conn {:dataset-version-id dsv-id}))))
            (db.transformation/new-transformation-job-execution tenant-conn {:id job-execution-id :dataset-id dataset-id})
            (execute-tx deps job-execution-id dataset-id command)
            (lib/ok {:jobExecutionId job-execution-id
                     :datasetId dataset-id}))))
      (lib/bad-request {:message "Dataset not found"}))))
