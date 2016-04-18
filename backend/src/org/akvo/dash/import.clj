(ns org.akvo.dash.import
  (:require
   [cheshire.core :as json]
   [clj-http.client :as client]
   [clojure.data.csv :as csv]
   [clojure.string :as str]
   [hugsql.core :as hugsql]
   [pandect.algo.sha1 :refer [sha1]]
   [org.akvo.dash.transformation :as t]
   [org.akvo.dash.import.flow]
   [org.akvo.dash.util :refer (squuid)]
   [org.akvo.dash.import.common :refer (make-dataset-data-table)]))

(hugsql/def-db-fns "org/akvo/dash/import.sql")

(defn do-import [conn config {:strs [title description] :as settings}]
  (let [table-name (str "ds_" (str/replace (java.util.UUID/randomUUID) "-" "_"))
        status (make-dataset-data-table conn config table-name settings)]
    (if (:success? status)
      (let [dataset-id (squuid)]
        (insert-dataset conn {:id dataset-id
                              :title title
                              :description description
                              :settings (json/generate-string settings)})
        (insert-dataset-version conn {:id (squuid)
                                      :dataset-id dataset-id
                                      :table-name table-name
                                      :version 1})

        (insert-dataset-columns conn {:columns (vec (map-indexed (fn [order [title column-name type]]
                                                                   [(squuid) dataset-id type title column-name (* 10 (inc order))])
                                                                 (:columns status)))})
        (assoc status :dataset-id dataset-id))
      status)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Handle different types
;;;

(defmulti parse-content
  "Hook that enables data type special cases."
  (fn [content] (:type content))
  :default
  (fn [content]
    (throw (IllegalArgumentException.
            (str "Can't process data of " (:type content) " type.")))))

(defmethod parse-content "csv" [{data :data}]
  (-> (csv/read-csv data)
      t/parse-csv-with-headers))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Get data
;;;

(defmulti content
  "Based on kind of datasource get data."
  (fn [datasource] (get-in datasource [:spec "kind"]))
  :default
  (fn [datasource]
    (throw (IllegalArgumentException.
            (str "Can't get data of "
                 (get-in datasource [:spec "kind"]) " kind.")))))

(defmethod content "LINK" [{{:strs [url]} :spec}]
  {:type (last (str/split url #"\."))
   :data (:body (client/get url))})

(defmethod content "DATA_FILE" [{{:strs [fileName url]} :spec}]
  {:type (last (str/split fileName #"\."))
   :data (slurp (str "/tmp/akvo/dash/resumed/"
                     (last (str/split url #"\/"))
                     "/file"))})

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API
;;;

(defn job
  ""
  [db datasource dataset]
  (let [data (-> (content datasource)
                 parse-content)]
    (try
      (update-dataset-data db
                           {:id     (:id dataset)
                            :status "OK"
                            :d      data})
      (catch Exception e
        (update-dataset-data db
                             {:id     (:id dataset)
                              :status "FAILURE"
                              :d      ""})
        (prn e)
        (prn (.getNextException e))))))
