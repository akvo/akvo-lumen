(ns akvo.lumen.fixtures
  (:require [akvo.lumen.component.error-tracker :refer [local-error-tracker]]
            [akvo.lumen.test-utils :as test-utils]
            [akvo.lumen.test-utils
             :refer
             [import-file test-tenant test-tenant-conn]]
            [ragtime.jdbc :as rjdbc]
            [ragtime.repl :as repl]
            [hugsql.core :as hugsql]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]))

(hugsql/def-db-fns "public_tables.sql")

(defn- ragtime-spec
  [tenant]
  {:datastore  (rjdbc/sql-database {:connection-uri (:db_uri tenant)})
   :migrations (rjdbc/load-resources "akvo/lumen/migrations/tenants")})

(defn migrate-tenant
  [tenant]
  (repl/migrate (ragtime-spec tenant)))

(defn rollback-tenant
  [tenant]
  (let [spec (ragtime-spec tenant)]
    (repl/rollback spec (count (:migrations spec)))))

(defn- user-manager-ragtime-spec []
  {:datastore
   (rjdbc/sql-database {:connection-uri (:db_uri (test-utils/test-tenant-manager))})
   :migrations
   (rjdbc/load-resources "akvo/lumen/migrations/tenant_manager")})

(defn migrate-user-manager []
  (repl/migrate (user-manager-ragtime-spec)))

(defn drop-all-data [tenant]
  (let [db {:connection-uri (:db_uri tenant)}
        public-tables (db-public-tables db)
        truncate-call (format "TRUNCATE %s CASCADE;"
                              (string/join ","
                                           (for [table public-tables]
                                             (:table_name table))))]
    (jdbc/execute! db [truncate-call])))

(def ^:dynamic *tenant-conn*)

(defn tenant-conn-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  [f]
  (migrate-tenant test-tenant)
  (binding [*tenant-conn* (test-tenant-conn test-tenant)]
    (f)
    (drop-all-data test-tenant)))

(def ^:dynamic *error-tracker*)

(defn error-tracker-fixture
  "Returns a fixture that binds a local error tracker to *error-tracker*"
  [f]
  (binding [*error-tracker* (local-error-tracker {})]
    (f)))
