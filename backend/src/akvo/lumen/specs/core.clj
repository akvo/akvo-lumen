(ns akvo.lumen.specs.core
  (:require [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen])
  (:import javax.sql.DataSource))

(defn exception? [e]
  (instance? java.lang.Exception e))

(defn db-connection? [o]
  (satisfies? javax.sql.DataSource o))

(s/def ::any (s/with-gen
               (constantly true)
               #(s/gen #{{}})))

(s/def ::string-nullable (s/or :s string? :n nil?))

(s/def ::int-nullable (s/or :s int? :n nil?))

(defn sample
  ([spec]
   (gen/generate (s/gen spec)))
  ([m spec]
   (assoc m (keyword (str (namespace spec) "/" (name spec))) (sample spec))))

(defn sample-all [specs]
  (reduce sample {} specs))
