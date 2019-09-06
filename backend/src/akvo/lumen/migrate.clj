(ns akvo.lumen.migrate
  (:require
   [akvo.lumen.component.hikaricp :as hikaricp]
   [akvo.lumen.config :as config]
   [akvo.lumen.lib.aes :as aes]
   [clojure.java.io :as io]
   [clojure.tools.logging :as log]
   [duct.core :as duct]
   [clojure.spec.alpha :as s]
   [environ.core :refer [env]]
   [hugsql.core :as hugsql]
   [integrant.core :as ig]
   [meta-merge.core :refer [meta-merge]]
   [ragtime
    strategy
    [jdbc :as ragtime-jdbc]
    [repl :as ragtime-repl]]))

(hugsql/def-db-fns "akvo/lumen/migrate.sql")

(def source-files ["akvo/lumen/system.edn" "dev.edn" "local.edn"])

(defn ignore-future-migrations
  "A strategy that raises an error if there are any conflicts between the
  applied migrations and the defined migration list, unless the conflicts are
  just future migrations."
  [applied migrations]
  (let [[conflicts unapplied] (#'ragtime.strategy/split-at-conflict applied migrations)]
    (if (and (seq conflicts)
             (seq unapplied))
      (throw (Exception.
               (str "Conflict! Expected " (first unapplied)
                    " but " (first conflicts) " was applied.")))
      (for [m unapplied] [:migrate m]))))

(defn do-migrate [datastore migrations]
  (ragtime-repl/migrate {:datastore datastore
                         :migrations migrations
                         :strategy ignore-future-migrations}))

(defn load-migrations
  "From a system definition get migrations for tenant manager and tenants."
  [system]
  {:tenant-manager (ragtime-jdbc/load-resources
                    (get-in system [:akvo.lumen.migrate/migrate :migrations :tenant-manager]))
   :tenants        (ragtime-jdbc/load-resources
                    (get-in system [:akvo.lumen.migrate/migrate :migrations :tenants]))})

(defn migrate
  "Migrate tenant manager and tenants."
  ([config]
   (let [migrations (load-migrations config)
         tenant-manager-db {:connection-uri (hikaricp/ssl-url (get-in config [:akvo.lumen.component.hikaricp/hikaricp :uri]))}]
     (do-migrate (ragtime-jdbc/sql-database tenant-manager-db)
                 (:tenant-manager migrations))
     (doseq [tenant (all-tenants tenant-manager-db)]
       (try
         (do-migrate (ragtime-jdbc/sql-database
                      {:connection-uri (hikaricp/ssl-url (aes/decrypt (get-in config [:akvo.lumen.component.tenant-manager/data :encryption-key])
                                                                      (:db_uri tenant)))})
                        (:tenants migrations))
         (catch Exception e (throw (ex-info "Migration failed" {:tenant (:label tenant)} e))))))))

(defn migrate-tenant
  [tenant-conn]
  (let [system (config/construct)
        migrations (load-migrations system)]
    (do-migrate (ragtime-jdbc/sql-database tenant-conn)
                (:tenants migrations))))

(defn do-rollback [datastore migrations amount-or-id]
  (ragtime-repl/rollback {:datastore  datastore
                          :migrations migrations}
                         amount-or-id))

(defn rollback-tenants [db connection-uri-fn migrations amount-or-id]
  (doseq [tenant (all-tenants db)]
    (do-rollback (ragtime-jdbc/sql-database {:connection-uri (connection-uri-fn tenant)})
                 migrations
                 amount-or-id)))

(defn rollback
  "(rollback) ;; will rollback tenants
  (rollback 1 ;; will rollback 1 migration on all tenants)
  (rollback :tenant-manager) ;; will rollback tenant manager migrations"
  [config arg]
  (let [migrations (load-migrations config)
        tenant-migrations (:tenants migrations)
        tenant-manager-migrations (:tenant-manager migrations)

        tenant-manager-db {:connection-uri (hikaricp/ssl-url (get-in config [:akvo.lumen.component.hikaricp/hikaricp :uri]))}
        tenant-connection-uri-fn #(hikaricp/ssl-url
                                   (aes/decrypt
                                    (get-in config [:akvo.lumen.component.tenant-manager/data :encryption-key])
                                    (:db_uri %)))]
    (cond
      (= arg :tenant-manager)
      (do-rollback (ragtime-jdbc/sql-database tenant-manager-db)
                   tenant-manager-migrations
                   (count tenant-manager-migrations))

      (number? arg)
      (rollback-tenants tenant-manager-db tenant-connection-uri-fn
                        (:tenants migrations)
                        arg)

      :else
      (rollback-tenants tenant-manager-db tenant-connection-uri-fn
                        (:tenants migrations)
                        (count (:tenants migrations))))))

(defmethod ig/init-key :akvo.lumen.migrate/migrate [_ opts]
  opts)
(s/def ::tenant-manager string?)
(s/def ::tenants string?)
(s/def ::seed any?)

(s/def ::migrations (s/keys :req-un [::tenant-manager ::tenants]
                            :opt-un [::seed]))

(defmethod ig/pre-init-spec :akvo.lumen.migrate/migrate [_]
  (s/keys :req-un [::migrations]))

