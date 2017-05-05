(ns akvo.lumen.endpoint.tier
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.tier :as tier]
            [compojure.core :refer :all]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/tiers" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (tier/all tenant-conn)))))
