(ns org.akvo.lumen.endpoint.job-execution
  (:require [compojure.core :refer :all]
            ;; [hugsql.core :as hugsql]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.job-execution :as job-execution]
            [ring.util.response :as response]))

;; (hugsql/def-db-fns "org/akvo/lumen/job-execution.sql")

#_(defn status
  "Get the status of a job execution. There are three different states:
  * { \"status\": \"PENDING\", \"jobExecytionId\": <id> }
  * { \"status\": \"FAILED\", \"jobExecutionId\": <id>, \"reason\": <reason> }
  * { \"status\": \"OK\", \"jobExecutionId\": <id>, \"datasetId\": <dataset-id> }
  Returns nil if the job execution does not exist"
  [conn id]
  (if-let [{:keys [dataset_id]} (dataset-id-by-job-execution-id conn {:id id})]
    {"jobExecutionId" id
     "status" "OK"
     "datasetId" dataset_id}
    (when-let [{:keys [status error-message]} (job-execution-by-id conn {:id id})]
      {"jobExecutionId" id
       "status" status
       "reason" error-message})))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/job_executions" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (if-let [status (job-execution/status tenant-conn id)]
          (response/response status)
          (response/not-found {"jobExecutionId" id}))))))
