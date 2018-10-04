(ns akvo.lumen.endpoint.tier
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.tier :as tier]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/tiers" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (tier/all tenant-conn)))))

(defmethod ig/init-key :akvo.lumen.endpoint.tier/tier  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.tier/tier  [_ opts])
