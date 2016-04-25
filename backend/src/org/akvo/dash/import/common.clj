(ns org.akvo.dash.import.common
  (:require [cheshire.core :as json]))

(defmulti make-dataset-data-table
  "Creates a dataset data table with data populated according to the
  data source spec. Returns a status map with keys

  :success? - true if import was successful, false otherwise
  :reason - Short description of the reason for a failed import
  :columns - A sequence of 3-tuples of the form

                 [title column-name type]

             where title is the user visible title of the column,
             column-name is the name of the column in the generated
             table and type is the user visible type of the column
             data (string/number/date)"
  (fn [tenant-conn config table-name spec]
    (get spec "type")))


(defmethod make-dataset-data-table :default
  [_ _ _ spec]
  {:success? false
   :reason (str "Invalid data source: " (json/generate-string spec))})
