(ns org.akvo.dash.import
  (:require [akvo.commons.psql-util :as pg]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.data.csv :as csv]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [org.akvo.dash.import.common :as import]
            [org.akvo.dash.import.csv]
            [org.akvo.dash.import.flow]
            [org.akvo.dash.transformation :as t]
            [org.akvo.dash.util :refer (squuid)]
            [ring.util.response :as res]))

(hugsql/def-db-fns "org/akvo/dash/import.sql")

(defn successful-import [conn job-execution-id table-name status spec]
  (let [dataset-id (squuid)]
    (insert-dataset conn {:id dataset-id
                          :title (get spec "name") ;; TODO Consistent naming. Change on client side?
                          :description (get spec "description" "")})

    (insert-dataset-version conn {:id (squuid)
                                  :dataset-id dataset-id
                                  :job-execution-id job-execution-id
                                  :table-name table-name
                                  :version 1
                                  :columns (mapv (fn [[title column-name type]]
                                                   {:type type
                                                    :title title
                                                    :columnName column-name
                                                    :sort nil
                                                    :direction nil
                                                    :hidden false})
                                                 (:columns status))})
    (update-successful-job-execution conn {:id job-execution-id})))

(defn failed-import [conn job-execution-id reason]
  (update-failed-job-execution conn {:id job-execution-id
                                     :reason reason}))

(defn do-import [conn config job-execution-id]
  (try
    (let [table-name (str "ds_" (str/replace (java.util.UUID/randomUUID) "-" "_"))
          spec (:spec (data-source-spec-by-job-execution-id conn {:job-execution-id job-execution-id}))
          status (import/make-dataset-data-table conn config table-name (get spec "source"))]
      (if (:success? status)
        (successful-import conn job-execution-id table-name status spec)
        (failed-import conn job-execution-id (:reason status))))
    (catch Exception e
      (failed-import conn job-execution-id (str "Unknown error: " (.getMessage e)))
      (.printStackTrace e))))

(defn handle-import-request [tenant-conn config claims data-source]
  (if-not (import/valid? (get data-source "source"))
    (-> (res/response {"dataSource" data-source})
        (res/status 400))
    (if-not (import/authorized? claims config (get data-source "source"))
      (-> (res/response {"dataSource" data-source})
          (res/status 401))
      (let [data-source-id (str (squuid))
            job-execution-id (str (squuid))]
        (insert-data-source tenant-conn {:id data-source-id
                                         :spec (json/generate-string data-source)})
        (insert-job-execution tenant-conn {:id job-execution-id
                                           :data-source-id data-source-id})
        (future (do-import tenant-conn config job-execution-id))
        (res/response {"importId" job-execution-id})))))

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
