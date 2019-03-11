(ns akvo.lumen.endpoint.tier
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.tier :as tier]
            [akvo.lumen.specs.components :refer [integrant-key]]
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

(defmethod integrant-key :akvo.lumen.endpoint.tier/tier [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
