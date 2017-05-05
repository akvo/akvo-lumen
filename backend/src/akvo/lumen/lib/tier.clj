(ns akvo.lumen.lib.tier
  (:require [akvo.lumen.lib.tier-impl :as impl]))

(defn all
  "Returns all tiers."
  [tenant-conn]
  (impl/all tenant-conn))
