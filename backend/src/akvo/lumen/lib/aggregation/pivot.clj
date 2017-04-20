(ns akvo.lumen.lib.aggregation.pivot
  (:require [akvo.lumen.lib.aggregation.pivot-impl :as impl]))

(defn query
  "Return the result of a dataset pivot query"
  [tenant-conn dataset query]
  (impl/query tenant-conn dataset query))
