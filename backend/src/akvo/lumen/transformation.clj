(ns akvo.lumen.transformation
  (:refer-clojure :exclude [apply])
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.util :refer (squuid)]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/job-execution.sql")

(def transformation-namespaces
  '[akvo.lumen.transformation.change-datatype
    akvo.lumen.transformation.text
    akvo.lumen.transformation.sort-column
    akvo.lumen.transformation.filter-column
    akvo.lumen.transformation.combine
    akvo.lumen.transformation.derive
    akvo.lumen.transformation.rename-column
    akvo.lumen.transformation.delete-column])

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
  [tenant-conn dataset-id command]
  (if-let [dataset (dataset-by-id tenant-conn {:id dataset-id})]
    (let [v (validate command)
          job-execution-id (str (squuid))]
      (if (:valid? v)
        (try
          (new-transformation-job-execution tenant-conn {:id job-execution-id :dataset-id dataset-id})
          (jdbc/with-db-transaction [tx-conn tenant-conn]
            (condp = (:type command)
              :transformation (engine/execute-transformation tx-conn dataset-id job-execution-id (:transformation command))
              :undo (engine/execute-undo tx-conn dataset-id job-execution-id)))
          (update-successful-job-execution tenant-conn {:id job-execution-id})
          (lib/ok {"jobExecutionId" job-execution-id "datasetId" dataset-id})
          (catch Exception e
            (let [msg (.getMessage e)]
              (update-failed-job-execution tenant-conn {:id job-execution-id :reason [msg]})
              (lib/conflict {"jobExecutionId" job-execution-id "datasetId" dataset-id "message" msg}))))
        (lib/bad-request {"message" (:message v)})))
    (lib/bad-request {"message" "Dataset not found"})))
