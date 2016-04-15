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


(defn str->uuid ;; unnecessary?
  "Converts a string to a UUID.
  This will thrown on invalid uuid!"
  [s]
  (java.util.UUID/fromString s))
