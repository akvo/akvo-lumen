(ns akvo.lumen.specs
  (:require [akvo.lumen.util :refer (squuid)]
            [clj-time.coerce :as tcc]
            [clj-time.core :as tc]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.test.check.generators :as tgen]
            [clojure.tools.logging :as log]
            [integrant.core :as ig])
  (:import [java.util UUID]
           [java.time Instant]))

(defn keyname [key] (str (namespace key) "/" (name key)))

(defn sample-with-gen* [s map-gen]
  (last (map first (s/exercise s 10 (reduce-kv (fn [c k v]
                                                  (if (fn? v)
                                                    (assoc c k v)
                                                    (assoc c k #(s/gen #{v})))
                                                  ) {} map-gen)))))


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
    (try
      (uuid? (UUID/fromString v))
      (catch Throwable t false))))

(def str-uuid-gen #(s/gen (reduce (fn [c _] (conj c (str (squuid)))) #{} (range 100))))

(s/def ::str-uuid
  (s/with-gen
    str-uuid?
    str-uuid-gen))

(def sort? #{"ASC" "DESC"})
(s/def ::sort sort?)

(defn sample-with-filter
  "generates a sample satisfying a filter condition."
  ([spec filter-fun]
   (sample-with-filter spec filter-fun 20))
  ([spec filter-fun attempts]
   (loop [attempt 0]
     (let [res (filter filter-fun (sample spec attempts))]
       (if (and (empty? res) (< attempt attempts))
         (recur (inc attempt))
         (first res))))))

(defmethod ig/init-key :akvo.lumen.specs/specs [_ opts]
  opts)

(s/def ::conform-specs boolean?)
(defmethod ig/pre-init-spec :akvo.lumen.specs/specs [_]
  (s/keys :req-un [::conform-specs]))

(s/def ::date-number (s/nilable number?))

(s/def ::non-empty-string
  (s/with-gen
    (s/and string? (complement string/blank?))
    #(gen/not-empty (gen/string-alphanumeric))))


(def year-gen (tgen/choose 1976 2018))

(def month-gen (tgen/choose 1 12))

(def day-gen (tgen/choose 1 31))

(def date-gen (tgen/such-that (fn [t]
                                (try
                                  (apply tc/date-time t)
                                  (catch Exception e false)))
                              (tgen/tuple year-gen month-gen day-gen)))

(def instant-gen (tgen/fmap (fn [e] (Instant/ofEpochMilli (tcc/to-long (apply tc/date-time e)))) date-gen))

(def false-gen (gen/return false))

(def text-year-gen (tgen/fmap str year-gen))

(defn date-format-gen [fun] (tgen/fmap fun date-gen))

(comment
  (gen/sample date-gen 10)

  (gen/sample instant-gen 10)
  (gen/sample (date-format-gen (fn [[y _ _]] (str y))) 10)
)
