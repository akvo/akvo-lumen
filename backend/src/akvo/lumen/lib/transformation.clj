(ns akvo.lumen.lib.transformation
  (:refer-clojure :exclude [apply])
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [akvo.lumen.util :refer (squuid)]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(def transformation-namespaces
  '[akvo.lumen.lib.transformation.change-datatype
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

(defn apply
  [{:keys [tenant-conn] :as deps} dataset-id command]
  (if-let [dataset (dataset-by-id tenant-conn {:id dataset-id})]
    (let [v (validate command)
          job-execution-id (str (squuid))]
      (if (:valid? v)
        (try
          (new-transformation-job-execution tenant-conn {:id job-execution-id :dataset-id dataset-id})
          (jdbc/with-db-transaction [tx-conn tenant-conn]
            (let [tx-deps (assoc deps :tenant-conn tx-conn)]
              (condp = (:type command)
                :transformation (engine/execute-transformation tx-deps dataset-id job-execution-id (:transformation command))
                :undo (engine/execute-undo tx-deps dataset-id job-execution-id))))
          (update-successful-job-execution tenant-conn {:id job-execution-id})
          (lib/ok {"jobExecutionId" job-execution-id "datasetId" dataset-id})
          (catch Exception e
            (let [msg (.getMessage e)]
              (engine/log-ex e)
              (update-failed-job-execution tenant-conn {:id job-execution-id :reason [msg]})
              (lib/conflict {"jobExecutionId" job-execution-id "datasetId" dataset-id "message" msg}))))
        (lib/bad-request {"message" (:message v)})))
    (lib/bad-request {"message" "Dataset not found"})))
