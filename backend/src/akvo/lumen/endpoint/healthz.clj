(ns akvo.lumen.endpoint.healthz
  (:require [akvo.lumen.http :as http]
            [environ.core :as env]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]))

(defn endpoint [_]
  (GET "/healthz" {:as req}
    (http/ok {:healthz "ok"
              :pod (env/env :pod-name)
              :blue-green-status (get-in req [:headers "x-blue-green-state"])})))

(defmethod ig/init-key :akvo.lumen.endpoint.healthz  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.healthz :opts opts)
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.healthz  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.healthz opts))
