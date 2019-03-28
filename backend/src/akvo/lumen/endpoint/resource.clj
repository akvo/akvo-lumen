(ns akvo.lumen.endpoint.resource
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.resource :as resource]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))


(defn handler [{:keys [tenant-manager]}]
  (fn [{tenant :tenant}]
    (resource/all (p/connection tenant-manager tenant)
                  (p/current-plan tenant-manager tenant))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/resources"
   {:get {:responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.resource/resource  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.resource/resource [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
