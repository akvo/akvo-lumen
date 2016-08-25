(ns org.akvo.lumen.migrate
  (:require
   [clojure.java.io :as io]
   [duct.util.system :refer [read-config]]
   [environ.core :refer [env]]
   [hugsql.core :as hugsql]
   [org.akvo.lumen.config :refer [bindings]]
   [meta-merge.core :refer [meta-merge]]
   [ragtime
    [jdbc :as ragtime-jdbc]
    [repl :as ragtime-repl]]))

(hugsql/def-db-fns "org/akvo/lumen/migrate.sql")

(def source-files ["org/akvo/lumen/system.edn" "dev.edn" "local.edn"])

(defn do-migrate [datastore migrations]
  (ragtime-repl/migrate {:datastore datastore
                         :migrations migrations}))

(defn construct-system
  "Create a system definition."
  ([] (construct-system source-files {}))
  ([sources bindings]
   (->> (map io/resource sources)
        (remove nil?)
        (map #(read-config % bindings))
        (apply meta-merge))))


(defn load-migrations
  "From a system definition get migrations for tenant manager and tenants."
  [system]
  {:tenant-manager (ragtime-jdbc/load-resources
                    (get-in system [:config :app :migrations :tenant-manager]))
   :tenants        (ragtime-jdbc/load-resources
                    (get-in system [:config :app :migrations :tenants]))})


(defn migrate
  "Migrate tenant manager and tenants."
  ([] (migrate source-files))
  ([system-definitions]
   (let [system (construct-system system-definitions bindings)
         migrations (load-migrations system)
         tenant-manager-db {:connection-uri (get-in system [:config :db :uri])}]
     (do-migrate (ragtime-jdbc/sql-database tenant-manager-db)
                 (:tenant-manager migrations))
     (doseq [tenant (all-tenants tenant-manager-db)]
       (do-migrate (ragtime-jdbc/sql-database {:connection-uri (:db_uri tenant)})
                   (:tenants migrations))))))


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


(defn rollback-tenants [db migrations amount-or-id]
  (doseq [tenant (all-tenants db)]
    (do-rollback (ragtime-jdbc/sql-database {:connection-uri (:db_uri tenant)})
                 migrations
                 amount-or-id)))


(defn rollback
  "(rollback) ;; will rollback tenants
  (rollback 1 ;; will rollback 1 migration on all tenants)
  (rollback :tenant-manager) ;; will rollback tenant manager migrations"
  [arg]
  (let [system (construct-system source-files bindings)
        migrations (load-migrations system)
        tenant-migrations (:tenants migrations)
        tenant-manager-migrations (:tenant-manager migrations)

        tenant-manager-db {:connection-uri (get-in system [:config :db :uri])}]
    (cond
      (= arg :tenant-manager)
      (do-rollback (ragtime-jdbc/sql-database tenant-manager-db)
                   tenant-manager-migrations
                   (count tenant-manager-migrations))

      (number? arg)
      (rollback-tenants tenant-manager-db
                        (:tenants migrations)
                        arg)

      :else
      (rollback-tenants tenant-manager-db
                        (:tenants migrations)
                        (count (:tenants migrations))))))
