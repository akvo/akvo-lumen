(ns akvo.lumen.endpoint.tier
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.tier :as tier]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/tiers" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (tier/all tenant-conn)))))

(defmethod ig/init-key :akvo.lumen.endpoint.tier/tier  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.tier :opts opts)
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.tier/tier  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.tier opts))
