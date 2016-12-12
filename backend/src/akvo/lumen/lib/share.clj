(ns akvo.lumen.lib.share
  (:require [akvo.lumen.lib.share-impl :as impl]))


(defn all
  "Get all shares"
  [tenant-conn]
  (impl/all tenant-conn))

(defn fetch
  "Get a share"
  [tenant-conn spec]
  (impl/fetch tenant-conn spec))

(defn delete
  "Delete a share"
  [tenant-conn id]
  (impl/delete-share-by-id tenant-conn {:id id}))
