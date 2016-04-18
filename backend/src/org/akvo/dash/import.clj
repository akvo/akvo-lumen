(ns org.akvo.dash.import
  "Import of data. LINK and DATA_FILE implemented."
  (:require
   [clj-http.client :as client]
   [clojure.data.csv :as csv]
   [clojure.string :as str]
   [hugsql.core :as hugsql]
   [org.akvo.dash.transformation :as t]))


(hugsql/def-db-fns "org/akvo/dash/import.sql")


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
