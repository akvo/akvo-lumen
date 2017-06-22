(ns akvo.lumen.lib.dataset-version
  (:require [akvo.lumen.endpoint :as endpoint]
            [akvo.lumen.http :as http]
            [clojure.set :as set]))

(defmethod endpoint/variant->response ::created
  [[_ dataset-version] _]
  (http/created {"datasetId" (:dataset-id dataset-version)}))

(defn created [dataset-version]
  {:pre [(set/subset? #{:id :dataset-id :version :table-name :imported-table-name
                        :transformations :columns}
                      (set (keys dataset-version)))]}
  [::created dataset-version])
