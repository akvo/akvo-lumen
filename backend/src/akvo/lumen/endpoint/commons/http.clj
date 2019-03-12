(ns akvo.lumen.endpoint.commons.http)

(defn- response [response-code]
  {:pre [(pos? response-code)]}
  (fn [body]
    {:pre [(coll? body)]}
    {:status response-code
     :body body}))


(def ok (response 200))
(def created (response 201))
(def bad-request (response 400))
(def not-authenticated (response 401))
(def not-authorized (response 403))
(def not-found (response 404))
(def conflict (response 409))
(def gone (response 410))
(def unprocessable-entity (response 422))
(def internal-server-error (response 500))
(def not-implemented (response 501))

(defn no-content []
  {:status 204
   :body nil})

(defn redirect [location]
  {:status 302
   :headers {"Location" location}
   :body nil})
