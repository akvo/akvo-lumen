(ns akvo.lumen.lib.job-execution
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.db.job-execution :as db.job-execution]))

(defn job-execution [conn id]
  (if-let [{:keys [status error-message kind dataset-id]} (db.job-execution/job-execution-by-id conn {:id id} {:identifiers identity})]
    (lib/ok
     {"jobExecutionId" id
      "status" status
      "datasetId" dataset-id
      "kind" kind
      "reason" error-message})
    (lib/not-found {:error "not-found"})))

(defn status
  "Get the status of a job execution. There are three different states:
  * { \"status\": \"PENDING\", \"jobExecytionId\": <id> }
  * { \"status\": \"FAILED\", \"jobExecutionId\": <id>, \"reason\": <reason> }
  * { \"status\": \"OK\", \"jobExecutionId\": <id>, \"datasetId\": <dataset-id> }"
  [conn kind id]
  {:pre [(#{:raster :dataset :transformation} kind)]}
  (condp = kind
    :raster (if-let [{:keys [raster_id]} (db.job-execution/raster-id-by-job-execution-id conn {:id id})]
              (lib/ok
               {"jobExecutionId" id
                "status" "OK"
                "rasterId" raster_id})
              (job-execution conn id))
    (if-let [{:keys [dataset_id]} (db.job-execution/dataset-id-by-job-execution-id conn {:id id})]
      (lib/ok
       {"jobExecutionId" id
        "status" "OK"
        "datasetId" dataset_id})
      (job-execution conn id))))
