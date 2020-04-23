(ns akvo.lumen.admin.system
  (:require [integrant.core :as ig]
            [akvo.lumen.config :refer [error-msg] :as config]))

(defn ig-select-keys [& more]
  (vec (flatten (apply conj [:akvo.lumen.component.emailer/mailjet-v3-emailer :akvo.lumen.admin.db/config] more))))

(defn ig-derives []
  (derive :akvo.lumen.component.emailer/mailjet-v3-emailer :akvo.lumen.component.emailer/emailer)
  (derive :akvo.lumen.component.error-tracker/prod :akvo.lumen.component.error-tracker/error-tracker))

(defn new-config [& paths]
  (apply config/construct (flatten ["akvo/lumen/config.edn" "akvo/lumen/admin.edn" paths])))

(comment (assert (not (:drop-if-exists? (:akvo.lumen.admin/add-tenant (new-config)))))
         (assert (:drop-if-exists? (:akvo.lumen.admin/add-tenant (new-config "local-admin.edn")))))


(defn new-system
  ([ks]
   (new-system (new-config) (ig-select-keys ks)))
  ([c ks]
   (let [conf (-> c
                  (select-keys (apply conj ks [:akvo.lumen.monitoring/dropwizard-registry
                                               :akvo.lumen.monitoring/collector
                                               :akvo.lumen.component.emailer/emailer
                                               :akvo.lumen.component.keycloak/authorization-service
                                               :akvo.lumen.component.tenant-manager/data])))]
     (ig/load-namespaces conf)
     (ig/init conf))))

