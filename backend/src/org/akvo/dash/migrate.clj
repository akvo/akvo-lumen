(ns org.akvo.dash.migrate
  "Migrates the tenant manager and it's tenants."
  (:require [hugsql.core :as hugsql]
            [ragtime
             [jdbc :as jdbc]
             [repl :as repl]]))

(hugsql/def-db-fns "org/akvo/dash/migrate.sql")

(defn do-migrate
  ""
  [path db-spec]
  (repl/migrate {:datastore  (jdbc/sql-database db-spec)
                 :migrations (jdbc/load-resources path)}))

(defn migrate
  ""
  [db-spec]
  ;; manager
  (do-migrate "org/akvo/dash/migrations_tenant_manager" db-spec)

  ;; tenants
  (doseq [tenant (all-tenants db-spec)]
    (do-migrate "org/akvo/dash/migrations_tenants"
                {:connection-uri (:db_uri tenant)})))
