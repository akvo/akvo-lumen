(ns org.akvo.lumen.lib.share
  (:require [org.akvo.lumen.lib.share-impl :as impl]))


(defn all
  "Get all shares"
  [tenant-conn]
  (impl/all-shares tenant-conn))

(defn visualisation
  "Share a visualisation"
  [tenant-conn visualisation-id]
  (impl/visualisation tenant-conn visualisation-id))

(defn dashboard
  "Share a dashboard"
  [tenant-conn dashboard-id]
  (impl/dashboard tenant-conn dashboard-id))

(defn delete
  "Delete a share"
  [tenant-conn id]
  (impl/delete-share-by-id tenant-conn {:id id}))
