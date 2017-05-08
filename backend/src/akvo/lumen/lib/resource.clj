(ns akvo.lumen.lib.resource
  (:require [akvo.lumen.lib.resource-impl :as impl]))

(defn all
  "Returns resources."
  [tenant-conn]
  (impl/all tenant-conn))
