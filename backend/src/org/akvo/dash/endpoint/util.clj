(ns org.akvo.dash.endpoint.util
  "Handy fns.")

(defn rr
  "Render json response. Defaults to status 200 & content-type
  application/json. To return a 404 response:
  (rr {:error \"Not found\"} {:status 404})"
  [body & args]
  (merge {:status  200
          :headers {"content-type" "application/json"}
          :body    body}
         (first args)))


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


(defn str->uuid ;; unnecessary?
  "Converts a string to a UUID.
  This will thrown on invalid uuid!"
  [s]
  (java.util.UUID/fromString s))
