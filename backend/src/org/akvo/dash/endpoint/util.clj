(ns org.akvo.dash.endpoint.util
  "WIP might not stay once we are further along."
  (:require
   [camel-snake-kebab.core :refer [->snake_case_string]]
   [cheshire.core :as json]
   [clojure.pprint :refer [pprint]]))


(defn rr
  "Expremental render response. Default to 200 application/json"
  [body & args]
  (merge {:status  200
          :headers {"content-type" "application/json"}
          :body    body}
         (first args)))

;; Deprecated
(defn render [v]
  (try
    {:status  200
     :headers {"Content-Type" "application/json"}
     :body    (json/generate-string v)}
    (catch Exception e
      {:status 500
       :headers {"Content-Type" "text/plain"}
       :body (str "Internal Server ERROR (500)\n\n" e)})))


(defn val->json-resp
  "Create a json response."
  ([val]
   {:status 200
    :headers {"Content-Type" "application/json"}
    :body (json/generate-string val {:key-fn (fn [k]
                                               (->snake_case_string k))})})
  ([val status]
   {:status status
    :headers {"Content-Type" "application/json"}
    :body    (json/generate-string val {:key-fn (fn [k]
                                                  (->snake_case_string k))})}))

(defmacro fn->json-resp
  "Tries to generate json from value of the provided function."
  [& body]
  `(try
     {:status 200
      :headers {"Content-Type" "application/json"}
      :body (json/generate-string ~@body)}
     (catch Exception e#
       (pprint e#)
       (.printStackTrace (.getNextException e#))
       {:status 500
        :headers {"Content-Type" "text/plain"}
        :body (str "Internal Server ERROR (500)\n\n" e#)})))


(defn squuid
  "Sequential UUIDs.
  Credit https://github.com/clojure-cookbook/clojure-cookbook/blob/master/01_primitive-data/1-24_uuids.asciidoc"
  []
  (let [uuid      (java.util.UUID/randomUUID)
        time      (System/currentTimeMillis)
        secs      (quot time 1000)
        lsb       (.getLeastSignificantBits uuid)
        msb       (.getMostSignificantBits uuid)
        timed-msb (bit-or (bit-shift-left secs 32)
                          (bit-and 0x00000000ffffffff msb))]
    (java.util.UUID. timed-msb lsb)))
