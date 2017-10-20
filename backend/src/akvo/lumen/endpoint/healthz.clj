(ns akvo.lumen.endpoint.healthz
  (:require [akvo.lumen.http :as http]
            [compojure.core :refer :all]))

(defn endpoint [_]
  (GET "/healthz" []
    (http/ok {:healthz "ok"})))
