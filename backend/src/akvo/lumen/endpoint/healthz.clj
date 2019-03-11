(ns akvo.lumen.endpoint.healthz
  (:require [akvo.lumen.endpoint.commons.http :as http]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [environ.core :as env]
            [integrant.core :as ig]))

(defn handler []
  (fn [{tenant :tenant :as req}]
    (http/ok {:healthz           "ok"
              :pod               (env/env :pod-name)
              :blue-green-status (get-in req [:headers "x-blue-green-state"])})))

(defn routes [_]
  ["/healthz"
   {:get {:responses {200 {}}
          :handler (handler)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.healthz/healthz  [_ opts]
  (routes opts))

(defmethod integrant-key :akvo.lumen.endpoint.healthz/healthz [_]
  (s/cat :kw keyword?
         :config empty?))
