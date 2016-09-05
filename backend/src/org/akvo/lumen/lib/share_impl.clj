(ns org.akvo.lumen.lib.share-impl
  (:require
   [clojure.string :as string]
   [hugsql.core :as hugsql])
  (:import
   (java.util Base64)
   (java.security SecureRandom)))

(hugsql/def-db-fns "org/akvo/lumen/endpoint/share.sql")

(defn random-url-safe-string
  "Returns a url safe random string of provided size. Defaults to size 8 bytes."
  ([] (random-url-safe-string 8))
  ([size]
   (let [random-bytes (let [seed (byte-array size)]
                        (.nextBytes (SecureRandom.) seed)
                        seed)
         encoder      (.withoutPadding (Base64/getUrlEncoder))]
     (String. (.encode encoder random-bytes)))))
