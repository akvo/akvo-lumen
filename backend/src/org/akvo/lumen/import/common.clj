(ns org.akvo.lumen.import.common
  (:require [cheshire.core :as json]))

(defn dispatch-on-kind [spec]
  (let [kind (get spec "kind")]
    (if (#{"LINK" "DATA_FILE"} kind)
      "CSV" ;; TODO: Unify elsewhere
      kind)))

(defmulti valid?
  "Validate the data source specification"
  (fn [spec]
    (dispatch-on-kind spec)))

(defmulti authorized?
  "Authorize the data source import request based on the users set of jwt claims"
  (fn [claims config spec]
    (dispatch-on-kind spec)))

(defmulti make-dataset-data-table
  "Creates a dataset data table with data populated according to the
  data source spec. Returns a status map with keys

  :success? - true if import was successful, false otherwise
  :reason - Short description of the reason for a failed import
  :columns - A sequence of maps with the column specification

                 {:title \"the title\"
                  :column-name \"c1\"
                  :type \"text\"}

             where title is the user visible title of the column,
             column-name is the name of the column in the generated
             table and type is the user visible type of the column
             data (text/number/date)"
  (fn [tenant-conn config table-name spec]
    (dispatch-on-kind spec)))


(defmethod valid? :default [spec]
  false)

(defmethod authorized? :default [claims spec]
  false)

(defmethod make-dataset-data-table :default
  [_ _ _ spec]
  {:success? false
   :reason (str "Invalid data source: " (json/generate-string spec))})
