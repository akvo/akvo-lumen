(ns akvo.lumen.util
  (:require [clojure.string :as str]
            [clojure.tools.logging :as log]))

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
  [prefix]
  (str prefix "_" (str/replace (java.util.UUID/randomUUID) "-" "_")))

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

(defmacro time*
  {:added "1.0"}
  [kw expr]
  `(let [start# (. System (nanoTime))
         ret# ~expr]
     (log/info (str ~kw ": " (/ (double (- (. System (nanoTime)) start#)) 1000000.0)))
     ret#))
