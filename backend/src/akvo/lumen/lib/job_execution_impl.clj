(ns akvo.lumen.lib.job-execution-impl
  (:require [akvo.lumen.lib :as lib]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")

(defn job-status
  "Get the status of a job execution. There are three different states:
  * { \"status\": \"PENDING\", \"jobExecytionId\": <id> }
  * { \"status\": \"FAILED\", \"jobExecutionId\": <id>, \"reason\": <reason> }
  * { \"status\": \"OK\", \"jobExecutionId\": <id>, \"datasetId\": <dataset-id> }
  Returns nil if the job execution does not exist"
  [conn id]
  (if-let [{:keys [dataset_id]} (dataset-id-by-job-execution-id conn {:id id})]
    (lib/ok
     {"jobExecutionId" id
      "status" "OK"
      "datasetId" dataset_id})
    (if-let [{:keys [status error-message]} (job-execution-by-id conn {:id id})]
      (lib/ok
       {"jobExecutionId" id
        "status" status
        "reason" error-message})
      (lib/not-found {:error "not-found"}))))
