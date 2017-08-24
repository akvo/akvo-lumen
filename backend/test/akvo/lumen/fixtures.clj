(ns akvo.lumen.fixtures
  (:require [akvo.lumen.test-utils :as test-utils]
            [hugsql.core :as hugsql]
            [ragtime.jdbc :as jdbc]
            [ragtime.repl :as repl]))


(hugsql/def-db-fns "akvo/lumen/fixtures.sql")


(defn- ragtime-spec
  [tenant]
  {:datastore  (jdbc/sql-database {:connection-uri (:db_uri tenant)})
   :migrations (jdbc/load-resources "akvo/lumen/migrations/tenants")})

(defn migrate-tenant
  [tenant]
  (repl/migrate (ragtime-spec tenant)))

(defn rollback-tenant
  [tenant]
  (let [spec (ragtime-spec tenant)]
    (repl/rollback spec (count (:migrations spec)))))

(defn- user-manager-ragtime-spec []
  {:datastore
   (jdbc/sql-database {:connection-uri (:db_uri (test-utils/test-tenant-manager))})
   :migrations
   (jdbc/load-resources "akvo/lumen/migrations/tenant_manager")})

(defn migrate-user-manager []
  (repl/migrate (user-manager-ragtime-spec)))
