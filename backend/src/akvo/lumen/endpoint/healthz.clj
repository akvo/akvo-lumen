(ns akvo.lumen.endpoint.healthz
  (:require [akvo.lumen.http :as http]
            [environ.core :as env]
            [compojure.core :refer :all]))

(defn endpoint [_]
  (GET "/healthz" {:as req}
    (http/ok {:healthz "ok"
              :pod (env/env :pod-name)
              :blue-green-status (get-in req [:headers "x-blue-green-state"])})))
