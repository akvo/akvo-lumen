(ns org.akvo.dash.import
  (:require [akvo.commons.psql-util :as pg]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.data.csv :as csv]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [pandect.algo.sha1 :refer [sha1]]
            [org.akvo.dash.transformation :as t]
            [org.akvo.dash.import.flow]
            [org.akvo.dash.import.csv]
            [org.akvo.dash.util :refer (squuid)]
            [org.akvo.dash.import.common :refer (make-dataset-data-table)]))

(hugsql/def-db-fns "org/akvo/dash/import.sql")

(defn do-import [conn config job-execution-id]
  (try
    (let [table-name (str "ds_" (str/replace (java.util.UUID/randomUUID) "-" "_"))
          spec (:spec (data-source-spec-by-job-execution-id conn {:job-execution-id job-execution-id}))
          status (make-dataset-data-table conn config table-name spec)]
       (if (:success? status)
         (let [dataset-id (squuid)]
           (insert-dataset conn {:id dataset-id
                                 :title (get spec "title")
                                 :description (get spec "description" "")})
           (insert-dataset-version conn {:id (squuid)
                                         :dataset-id dataset-id
                                         :job-execution-id job-execution-id
                                         :table-name table-name
                                         :version 1})
           (insert-dataset-columns conn {:columns (vec (map-indexed (fn [order [title column-name type]]
                                                                      [(squuid)
                                                                       dataset-id
                                                                       type
                                                                       title
                                                                       column-name
                                                                       (* 10 (inc order))])
                                                                    (:columns status)))}))

         (update-failed-job-execution conn {:id job-execution-id
                                            :reason (:reason status)})))
    (catch Exception e
      (.printStackTrace e))))

(defn handle-import-request [tenant-conn config data-source]
  (let [data-source-id (str (squuid))
        job-execution-id (str (squuid)) ]
    (insert-data-source tenant-conn {:id data-source-id
                                     :spec (json/generate-string data-source)})
    (insert-job-execution tenant-conn {:id job-execution-id
                                       :data-source-id data-source-id})
    (future (do-import tenant-conn config job-execution-id))
    {"importId" job-execution-id}))

(defn status
  "Get the status of an import (job execution). There are three different states:
  * { \"status\": \"PENDING\", \"importId\": <id> }
  * { \"status\": \"FAILED\", \"importId\": <id>, \"reason\": <reason> }
  * { \"status\": \"OK\", \"importId\": <id>, \"datasetId\": <dataset-id> }
  Returns nil if the import does not exist"
  [conn id]
  (if-let [{:keys [dataset_id]} (dataset-id-by-job-execution-id conn {:id id})]
    {"importId" id
     "status" "OK"
     "datasetId" dataset_id}
    (let [{:keys [error_reason] :as job-exec} (job-execution-by-id conn {:id id})]
      (when job-exec
        (if error_reason
          {"importId" id
           "status" "FAILED"
           "reason" error_reason}
          {"importId" id
           "status" "PENDING"})))))
