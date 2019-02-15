(ns akvo.lumen.endpoint.healthz
  (:require [akvo.lumen.endpoint.commons.http :as http]
            [compojure.core :refer :all]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [environ.core :as env]
            [integrant.core :as ig]))

(defn endpoint [_]
  (GET "/healthz" {:as req}
       (http/ok {:healthz           "ok"
                 :pod               (env/env :pod-name)
                 :blue-green-status (get-in req [:headers "x-blue-green-state"])})))

(defmethod ig/init-key :akvo.lumen.endpoint.healthz/healthz  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.healthz/healthz [_]
  (s/cat :kw keyword?
         :config empty?))
