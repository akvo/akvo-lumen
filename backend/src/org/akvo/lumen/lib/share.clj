(ns org.akvo.lumen.lib.share
  ""
  (:require
   [org.akvo.lumen.lib.share-impl :as impl]))


(defn collection
  "Returns all shared item for tenant."
  [conn]
  (impl/all-shares conn))

(defn share-visualisation
  "Share a visualisation"
  [tenant-conn visualisation-id]
  (first (impl/insert-visualisation-share tenant-conn
                                          {:id (impl/random-url-safe-string)
                                           :visualisation-id visualisation-id})))

(defn share-dashboard
  "Share a dashboard"
  [tenant-conn dashboard-id]
  (first (impl/insert-dashboard-share tenant-conn
                                      {:id (impl/random-url-safe-string)
                                       :dashboard-id dashboard-id})))

(defn end-share
  "Delete the share."
  [conn id]
  (impl/delete-share-by-id conn {:id id}))
