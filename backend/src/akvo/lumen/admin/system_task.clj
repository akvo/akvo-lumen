(ns akvo.lumen.admin.system-task
  (:require [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.component.hikaricp :as hikaricp]
            [akvo.lumen.protocols :as p]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [akvo.lumen.config :as config]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/admin/system-task.sql")

(comment
  "integrant needs to know which implementation to take in parent-child component relations
   in our case we use derive to specify it

   example of specifying prod email component"
  (derive :akvo.lumen.component.emailer/mailjet-v3-emailer :akvo.lumen.component.emailer/emailer)
  )

(defn new-system
  ([] (new-system {}))
  ([{:keys [db-uri email-user email-password encryption-key]}]
   (let [system-conf (select-keys (config/read-config "akvo/lumen/config.edn")
                                  [:akvo.lumen.monitoring/dropwizard-registry
                                   :akvo.lumen.component.tenant-manager/data
                                   :akvo.lumen.component.tenant-manager/tenant-manager
                                   :akvo.lumen.component.emailer/mailjet-v3-emailer
                                   :akvo.lumen.component.hikaricp/hikaricp])
         system-conf (cond-> system-conf
                       db-uri (assoc-in [:akvo.lumen.component.hikaricp/hikaricp :uri] db-uri)
                       email-user (assoc-in [:akvo.lumen.component.emailer/mailjet-v3-emailer :email-user] email-user)
                       email-password (assoc-in [:akvo.lumen.component.emailer/mailjet-v3-emailer :email-password] email-password)
                       encryption-key (assoc-in [:akvo.lumen.component.tenant-manager/data :encryption-key] encryption-key))]
     (ig/init system-conf))))

(defn fun-with-tenant-connection [system fun]
  (let [tenant-manager (:akvo.lumen.component.tenant-manager/tenant-manager system)
        res (doall
              (map (fn [tenant]
                     (fun tenant (p/connection tenant-manager (:label tenant))))
                   (all-tenants (-> tenant-manager :db :spec))))]
    (ig/halt! system)
    res))

(comment "example use"
         (fun-with-tenant-connection
          (new-system {:encryption-key "secret" :email-password "xxx" :email-user "xxx"})
          (fn [tenant tenant-connection]
            (map (fn [data]
                   (try
                     (when (-> (aggregation/query tenant-connection
                                                  (:dataset_id data)
                                                  (:type data)
                                                  (clojure.walk/keywordize-keys (:spec data)))
                               ((comp :sampled :metadata :common last)))
                       (-> data
                           (dissoc :spec)
                           (assoc :tenant (:label tenant))))
                     (catch Exception e
                       (log/error :ignore-viz (:label tenant) data (.getMessage e))))
                   )
                 (all-scatters-and-table-related tenant-connection))))

         )
