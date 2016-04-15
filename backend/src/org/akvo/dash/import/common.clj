(ns org.akvo.dash.import.common)

(defmulti make-dataset-data-table
  (fn [tenant-conn config table-name spec]
    (get spec "type")))


(defmethod make-dataset-data-table :default
  [_ _ _ {:strs [type]}]
  {:success? false
   :reason (str "No such data source: " type)})
