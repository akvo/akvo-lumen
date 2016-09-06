(ns org.akvo.lumen.lib.dataset
  (:require
   [org.akvo.lumen.lib.dataset-impl :as impl]))


(defn all-datasets [tenant-conn]
  (impl/all-datasets tenant-conn))

(defn new-dataset [tenant-conn config jwt-claims body]
  (impl/new-dataset tenant-conn config jwt-claims body))

(defn dataset [tenant-conn id]
  (impl/find-dataset tenant-conn id))

(defn delete-dataset [tenant-conn id]
  (impl/delete-dataset tenant-conn id))
