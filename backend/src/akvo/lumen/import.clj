(ns akvo.lumen.import
  (:require [akvo.commons.psql-util :as pg]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.data.csv :as csv]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [akvo.lumen.import.common :as import]
            [akvo.lumen.import.csv]
            [akvo.lumen.import.flow]
            [akvo.lumen.transformation :as t]
            [akvo.lumen.util :refer (squuid gen-table-name)]
            [ring.util.response :as res]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")


(defn successful-import [conn job-execution-id table-name status spec]
  (let [dataset-id (squuid)
        imported-table-name (gen-table-name "imported")]
    (insert-dataset conn {:id dataset-id
                          :title (get spec "name") ;; TODO Consistent naming. Change on client side?
                          :description (get spec "description" "")})
    (clone-data-table conn
                      {:from-table table-name
                       :to-table imported-table-name}
                      {}
                      {:transaction? false})
    (insert-dataset-version conn {:id (squuid)
                                  :dataset-id dataset-id
                                  :job-execution-id job-execution-id
                                  :table-name table-name
                                  :imported-table-name imported-table-name
                                  :version 1
                                  :columns (mapv (fn [{:keys [title column-name type]}]
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
                                     :reason [reason]}))

(defn do-import [conn config job-execution-id]
  (try
    (let [table-name (gen-table-name "ds")
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
