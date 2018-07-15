(ns akvo.lumen.specs.core
  (:require [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.tools.logging :as log]
            [akvo.lumen.util :refer (squuid)])
  (:import javax.sql.DataSource))

(defn exception? [e]
  (instance? java.lang.Exception e))

(defn db-connection? [o]
  (satisfies? javax.sql.DataSource o))

(s/def ::any (s/with-gen
               (constantly true)
               #(s/gen #{{}})))

(defn str-uuid? [v]
  (when (some? v)
    (uuid? (read-string (format "#uuid \"%s\"" v)))))

(s/def ::str-uuid
  (s/with-gen
    str-uuid?
    #(s/gen (reduce (fn [c _] (conj c (str (squuid)))) #{} (range 100)))))


(defn str-int? [v]
  (when (some? v)
    (try
      (int? (read-string v))
      (catch Exception e (log/debug (format  "trying to parse string as int ...cant parse %s as int" v))))))

(s/def ::str-int
  (s/with-gen
    str-int?
    #(s/gen (set (map str (repeatedly 100 (partial rand-int 100)))))))

(s/def ::date-int int?) ;; TODO: improve it 

(s/def ::string-nullable (s/or :s string? :n nil?))

(s/def ::int-nullable (s/or :s int? :n nil?))

(defn sample
  ([spec]
   (gen/generate (s/gen spec)))
  ([m spec]
   (assoc m (keyword (str (namespace spec) "/" (name spec))) (sample spec))))

(defn sample-all [specs]
  (reduce sample {} specs))
