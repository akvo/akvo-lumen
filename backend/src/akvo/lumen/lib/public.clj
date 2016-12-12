(ns akvo.lumen.lib.public
  (:require [akvo.lumen.lib.public-impl :as impl]))


(defn share
  "Return public share with id."
  [tenant-conn id]
  (impl/share tenant-conn id))
