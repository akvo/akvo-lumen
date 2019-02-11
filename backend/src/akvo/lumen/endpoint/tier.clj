(ns akvo.lumen.endpoint.tier
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.tier :as tier]
            [akvo.lumen.specs.components :refer (integrant-key)]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/tiers" {:keys [tenant]}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/" _
        (tier/all tenant-conn)))))

(defmethod ig/init-key :akvo.lumen.endpoint.tier/tier  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.tier/tier [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
