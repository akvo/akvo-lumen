(ns org.akvo.lumen.migrate
  "Migrates the tenant manager and it's tenants."
  (:require [clojure.core.match :refer [match]]
            [hugsql.core :as hugsql]
            [ragtime
             [jdbc :as jdbc]
             [repl :as repl]])
  (:import  org.postgresql.util.PSQLException))

(hugsql/def-db-fns "org/akvo/lumen/migrate.sql")

(defn do-migrate
  ""
  [path db-spec]
  (repl/migrate {:datastore  (jdbc/sql-database db-spec)
                 :migrations (jdbc/load-resources path)}))

(defn migrate
  ""
  [db-spec]
  ;; manager
  (do-migrate "org/akvo/lumen/migrations_tenant_manager" db-spec)

  ;; tenants
  (doseq [tenant (all-tenants db-spec)]
    (do-migrate "org/akvo/lumen/migrations_tenants"
                {:connection-uri (:db_uri tenant)})))

(defn- tenant-spec [spec tenant]
  (assoc spec :datastore (jdbc/sql-database {:connection-uri (:db_uri tenant)})))

(defn rollback
  "Rollback migrations, defaults to tenants and all migrations.
  API (more pragmatic than consistent...):
  (rollback db) ;; defaults to all migrations on tenants
  (rollback db 1) ;; 1 migration on tenants
  (rollback db :tenants) ;; all migrations on tenants
  (rollback db :tenants 1) ;; 1 migration on tenants
  (rollback db :tenant-manager) ;; all migrations on tenant manager
  (rollback db :tenant-manager 1) ;; 1 migration on tenant manager
  (rollback db :all) ;; All migrations on both tenant manager and tenants"
  [db args]
  (let [manager-spec     {:datastore  (jdbc/sql-database db)
                          :migrations (jdbc/load-resources
                                       "org/akvo/lumen/migrations_tenant_manager")}
        tenants          (try
                           (all-tenants db)
                           (catch PSQLException e []))
        tenant-spec-base {:migrations (jdbc/load-resources
                                       "org/akvo/lumen/migrations_tenants")}]
    (match [args]
           [([(_ :guard #(= % :all))] :seq)]
           (do
             (rollback db [:tenants])
             (rollback db [:tenant-manager]))

           [([(_ :guard #(= % :tenant-manager))
              (_ :guard number?)] :seq)]
           (repl/rollback manager-spec (second args))

           [([(_ :guard #(= % :tenant-manager)) & _] :seq)]
           (repl/rollback manager-spec (count (-> manager-spec :migrations)))

           [([(_ :guard number?)] :seq)]
           (rollback db [:tenants (first args)])

           [([(_ :guard #(= % :tenants))
              (_ :guard number?)] :seq)]
           (doseq [tenant tenants]
             (repl/rollback (tenant-spec tenant-spec-base tenant)
                            (second args)))

           :else
           (doseq [tenant tenants]
             (repl/rollback (tenant-spec tenant-spec-base tenant)
                            (count (-> tenant-spec-base :migrations)))))))
