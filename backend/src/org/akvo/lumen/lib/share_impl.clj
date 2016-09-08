(ns org.akvo.lumen.lib.share-impl
  (:require [clojure.string :as string]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response status]])
  (:import (java.util Base64)
           (java.security SecureRandom)))


(hugsql/def-db-fns "org/akvo/lumen/lib/share.sql")


(defn all [tenant-conn]
  (response (all-shares tenant-conn)))

(defn random-url-safe-string
  "Returns a url safe random string of provided size. Defaults to size 8 bytes."
  ([] (random-url-safe-string 8))
  ([size]
   (let [random-bytes (let [seed (byte-array size)]
                        (.nextBytes (SecureRandom.) seed)
                        seed)
         encoder      (.withoutPadding (Base64/getUrlEncoder))]
     (String. (.encode encoder random-bytes)))))

(defn visualisation
  "Share a visualisation"
  [tenant-conn visualisation-id]
  (first (insert-visualisation-share tenant-conn
                                     {:id (random-url-safe-string)
                                      :visualisation-id visualisation-id})))

(defn dashboard
  "Share a dashboard"
  [tenant-conn dashboard-id]
  (first (insert-dashboard-share tenant-conn
                                 {:id (random-url-safe-string)
                                  :dashboard-id dashboard-id})))

(defn fetch [tenant-conn spec]
  (cond
    (contains? spec "visualisationId")
    (if-let [v (visualisation tenant-conn (get spec "visualisationId"))]
      (response v)
      (not-found {:error "Not found"}))

    (contains? spec "dashboardId")
    (if-let [d (dashboard tenant-conn (get spec "dashboardId"))]
      (response d)
      (not-found {:error "Not found"}))

    :else
    (-> (response {:error "Required key not provided"})
        (status 400))))
