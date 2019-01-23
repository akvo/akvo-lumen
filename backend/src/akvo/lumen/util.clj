(ns akvo.lumen.util
  (:require [clojure.string :as str]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [clojure.spec.alpha :as s]
            [org.akvo.resumed :as resumed]))

(defn squuid
  "Sequential UUIDs.
  Credit https://github.com/clojure-cookbook/clojure-cookbook/blob/master/
  01_primitive-data/1-24_uuids.asciidoc"
  []
  (let [uuid      (java.util.UUID/randomUUID)
        time      (System/currentTimeMillis)
        secs      (quot time 1000)
        lsb       (.getLeastSignificantBits uuid)
        msb       (.getMostSignificantBits uuid)
        timed-msb (bit-or (bit-shift-left secs 32)
                          (bit-and 0x00000000ffffffff msb))]
    (java.util.UUID. timed-msb lsb)))

(defn gen-table-name
  "Generates a table name using a UUID suffix"
  ([]
   (gen-table-name nil))
  ([prefix]
   (str (when prefix (str prefix "_")) (str/replace (java.util.UUID/randomUUID) "-" "_"))))

(defn conform-email
  "Returns valid email or throws."
  [v]
  (let [rule #"(?i)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
        email (some->> v (re-matches rule))]
    (when (nil? email)
      (throw (ex-info "Email not valid." {:email v})))
    email))

(defn query-map
  "Takes a query-string \"a=1&b=2\" and returns a hash-map {:a 1 :b 2}"
  [query-string]
  (->> (str/split query-string #"&")
       (map #(str/split % #"="))
       (map (fn [[k v]] [(keyword k) v]))
       (into {})))

(defn get-path
  [spec file-upload-path]
  (or (get spec "path")
      (let [file-on-disk? (contains? spec "fileName")
            url (get spec "url")]
        (if file-on-disk?
          (resumed/file-for-upload file-upload-path url)
          (let [url (io/as-url url)]
            (when-not (#{"http" "https"} (.getProtocol url))
              (throw (ex-info (str "Invalid url: " url) {:url url})))
            url)))))

(defn index-by [key coll]
  (reduce (fn [index item]
            (assoc index (get item key) item))
          {}
          coll))

(defn valid-column-name? [s]
  (and (string? s)
       (boolean (re-find #"^[a-z][a-z0-9_]*$" s))))

(defn valid-dataset-id? [s]
  (and (string? s)
       (boolean (re-find #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" s))))

(defn valid-type? [s]
  (#{"text" "number" "date" "geopoint"} s))

(defn conform  
  ([s d]
   (when-not (s/valid? s d)
     (log/info (str s " spec problem!")
               {:message (s/explain-str s d)
                :data d})
     (throw (ex-info (str s " spec problem!")
                     {:message (s/explain-str s d)
                      :data d})))
   d)
  ([s d adapter]
   (conform s (adapter d))
   d))
