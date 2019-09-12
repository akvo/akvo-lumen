(ns akvo.lumen.admin.system
  (:require [integrant.core :as ig]
            [akvo.lumen.config :refer [error-msg] :as config]))

(defn ig-select-keys []
  [:akvo.lumen.component.emailer/mailjet-v3-emailer])

(defn ig-derives []
  (derive :akvo.lumen.component.emailer/mailjet-v3-emailer :akvo.lumen.component.emailer/emailer))

(defn admin-system
  ([]
   (admin-system (config/construct "akvo/lumen/config.edn") (ig-select-keys)))
  ([c ks]
   (let [conf (-> c
                  (select-keys (apply conj ks [:akvo.lumen.monitoring/dropwizard-registry
                                               :akvo.lumen.monitoring/collector
                                               :akvo.lumen.component.emailer/emailer
                                               :akvo.lumen.component.keycloak/authorization-service
                                               :akvo.lumen.component.keycloak/public-client
                                               :akvo.lumen.admin/add-tenant
                                               :akvo.lumen.component.tenant-manager/data])))]
     (ig/load-namespaces conf)
     (ig/init conf))))

