(ns org.akvo.dash.import.common
  (:require [cheshire.core :as json]))

(defmulti make-dataset-data-table
  (fn [tenant-conn config table-name spec]
    (get spec "type")))


(defmethod make-dataset-data-table :default
  [_ _ _ spec]
  {:success? false
   :reason (str "Invalid data source: " (json/generate-string spec))})
