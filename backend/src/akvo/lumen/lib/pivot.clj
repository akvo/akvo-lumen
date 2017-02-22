(ns akvo.lumen.lib.pivot
  (:require [akvo.lumen.lib.pivot-impl :as impl]))

(defn query
  "Return the result of a dataset pivot query"
  [tenant-conn id query]
  (impl/query tenant-conn id query))
