(ns org.akvo.lumen.lib.share-impl
  (:require [clojure.string :as string]
            [hugsql.core :as hugsql])
  (:import (java.util Base64)
           (java.security SecureRandom)))


(hugsql/def-db-fns "org/akvo/lumen/lib/share.sql")


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
