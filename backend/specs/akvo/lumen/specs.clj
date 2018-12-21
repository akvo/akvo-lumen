(ns akvo.lumen.specs
  (:require [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [akvo.lumen.util :refer (squuid)]
            [clojure.tools.logging :as log]))

(defn keyname [key] (str (namespace key) "/" (name key)))

(defn sample-with-gen [s map-gen amount]
  (map first (s/exercise s amount map-gen)))

(defn sample
  ([s]
   (sample s 1))
  ([s amount]
   (let [res (map first (s/exercise s amount))]
     (if (== 1 amount)
       (first res)
       res))))

(defn str-uuid? [v]
  (when (some? v)
    (uuid? (read-string (format "#uuid \"%s\"" v)))))

(s/def ::str-uuid
  (s/with-gen
    str-uuid?
    #(s/gen (reduce (fn [c _] (conj c (str (squuid)))) #{} (range 100)))))

(s/def ::sort #{"ASC" "DESC"})
