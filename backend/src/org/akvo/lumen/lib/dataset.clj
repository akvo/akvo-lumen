(ns org.akvo.lumen.lib.dataset
  (:require
   [org.akvo.lumen.lib.dataset-impl :as impl]))


(defn all
  "Return all datasets."
  [tenant-conn]
  (impl/all-datasets tenant-conn))

(defn create
  "Create new dataset. Body should conform..."
  [tenant-conn config jwt-claims body]
  (impl/create tenant-conn config jwt-claims body))

(defn fetch
  ""
  [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn delete
  ""
  [tenant-conn id]
  (impl/delete tenant-conn id))
