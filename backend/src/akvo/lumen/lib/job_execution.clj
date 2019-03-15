(ns akvo.lumen.lib.job-execution
  (:require [akvo.lumen.lib :as lib]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(defn job-execution [conn id]
  (if-let [{:keys [status error-message kind]} (job-execution-by-id conn {:id id})]
    (lib/ok
     {"jobExecutionId" id
      "status" status
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
    :dataset (if-let [{:keys [dataset_id]} (dataset-id-by-job-execution-id conn {:id id})]
               (lib/ok
                {"jobExecutionId" id
                 "status" "OK"
                 "datasetId" dataset_id})
               (job-execution conn id))
    :raster (if-let [{:keys [raster_id]} (raster-id-by-job-execution-id conn {:id id})]
              (lib/ok
               {"jobExecutionId" id
                "status" "OK"
                "rasterId" raster_id})
              (job-execution conn id))))
