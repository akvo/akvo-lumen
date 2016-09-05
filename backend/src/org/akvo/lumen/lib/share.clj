(ns org.akvo.lumen.lib.share
  ""
  (:require
   [org.akvo.lumen.lib.share-impl :refer :all]))


(defn collection
  "Returns all shared item for tenant."
  [conn]
  (all-shares conn))

(defn share-visualisation
  "Share a visualisation"
  [tenant-conn visualisation-id]
  (first (insert-visualisation-share tenant-conn
                                     {:id (random-url-safe-string)
                                      :visualisation-id visualisation-id})))

(defn share-dashboard
  "Share a dashboard"
  [tenant-conn dashboard-id]
  (first (insert-dashboard-share tenant-conn
                                 {:id (random-url-safe-string)
                                  :dashboard-id dashboard-id})))

(defn end-share
  "Delete the share."
  [conn id]
  (delete-share-by-id conn {:id id}))
