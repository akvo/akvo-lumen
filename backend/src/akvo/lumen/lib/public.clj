(ns akvo.lumen.lib.public
  (:require [akvo.lumen.lib.public-impl :as impl]))


(defn share
  "Return public share with id."
  [tenant-conn config id password]
  (impl/share tenant-conn config id password))
