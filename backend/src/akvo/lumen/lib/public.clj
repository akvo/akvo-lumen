(ns org.akvo.lumen.lib.public
  (:require [org.akvo.lumen.lib.public-impl :as impl]))


(defn share
  "Return public share with id."
  [tenant-conn id]
  (impl/share tenant-conn id))
