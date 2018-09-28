(ns akvo.lumen.migrate
  (:require
   [akvo.lumen.config :refer [bindings]]
   [akvo.lumen.lib.aes :as aes]
   [clojure.java.io :as io]
   [duct.core :as duct]
   [clojure.tools.logging :as log]
   [environ.core :refer [env]]
   [hugsql.core :as hugsql]
   [duct.util.system :as duct.system]
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

(defn read-config [config-path]
  (duct/read-config (io/resource config-path)))

(defn construct-system
  "Create a system definition."
  ([] (construct-system "akvo/lumen/config.edn" (bindings)))
  ([config-path bindings]
   (duct.system/load-system [(duct/prep (read-config config-path))] bindings)))




(defn load-migrations
  "From a system definition get migrations for tenant manager and tenants."
  [system]
  {:tenant-manager (ragtime-jdbc/load-resources
                    (get-in system [:akvo.lumen.config :app :migrations :tenant-manager]))
   :tenants        (ragtime-jdbc/load-resources
                    (get-in system [:akvo.lumen.config :app :migrations :tenants]))})


(defn migrate
  "Migrate tenant manager and tenants."
  ([] (migrate source-files))
  ([config-path]
   (let [system (construct-system config-path (bindings))
         migrations (load-migrations system)
         tenant-manager-db {:connection-uri (get-in system [:akvo.lumen.config :db :uri])}]
     (do-migrate (ragtime-jdbc/sql-database tenant-manager-db)
                 (:tenant-manager migrations))
     (doseq [tenant (all-tenants tenant-manager-db)]
       (try
         (do-migrate (ragtime-jdbc/sql-database
                          {:connection-uri (aes/decrypt (get-in system [:akvo.lumen.config :config :encryption-key])
                                                        (:db_uri tenant))})
                        (:tenants migrations))
         (catch Exception e (throw (ex-info "Migration failed" {:tenant (:label tenant)} e))))))))

(defn migrate-tenant
  [tenant-conn]
  (let [system (construct-system)
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
  [config-path arg]
  (let [system (construct-system config-path (bindings))
        migrations (load-migrations system)
        tenant-migrations (:tenants migrations)
        tenant-manager-migrations (:tenant-manager migrations)

        tenant-manager-db {:connection-uri (get-in system [:akvo.lumen.config :db :uri])}
        tenant-connection-uri-fn #(aes/decrypt (get-in system [:akvo.lumen.config :config :encryption-key])
                                       (:db_uri %))]
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
