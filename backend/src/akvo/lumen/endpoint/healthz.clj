(ns akvo.lumen.endpoint.healthz
  (:require [akvo.lumen.http :as http]
            [compojure.core :refer :all]
            [environ.core :as env]
            [integrant.core :as ig]))

(defn endpoint [_]
  (GET "/healthz" {:as req}
       (http/ok {:healthz           "ok"
                 :pod               (env/env :pod-name)
                 :blue-green-status (get-in req [:headers "x-blue-green-state"])})))

(defmethod ig/init-key :akvo.lumen.endpoint.healthz/healthz  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.healthz/healthz  [_ opts])
