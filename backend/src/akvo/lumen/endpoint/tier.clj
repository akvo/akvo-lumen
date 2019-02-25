(ns akvo.lumen.endpoint.tier
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.tier :as tier]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))


(defn handler [{:keys [tenant-manager]}]
  (fn [{tenant :tenant}]
    (tier/all (p/connection tenant-manager tenant))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/tiers"
   {:get {:responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.tier/tier  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.tier/tier [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
