(ns akvo.lumen.lib.aggregation.maps
  (:require [clojure.walk :as w]))

(defn add-filters [viz filter]
  (update-in viz [:spec  "layers"]
             (fn [ls]                                   
               (map (fn [layer]
                      (if (= (:datasetId filter) (get layer "datasetId"))
                        (update layer "filters" #(apply conj % (w/stringify-keys (:columns  filter))))
                        layer
                        )) ls))))
