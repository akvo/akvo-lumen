(ns akvo.lumen.http)

(defn- response [response-code]
  {:pre [(pos? response-code)]}
  (fn [body]
    {:pre [(map? body)]}
    {:status response-code
     :body body}))


(def ok (response 200))
(def created (response 201))
(def bad-request (response 400))
(def not-authenticated (response 401))
(def not-authorized (response 403))
(def not-found (response 404))
(def gone (response 410))
(def internal-server-error (response 500))
(def not-implemented (response 501))
