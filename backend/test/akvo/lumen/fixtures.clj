(ns akvo.lumen.fixtures
  (:require [akvo.lumen.component.caddisfly-test :refer (caddisfly)]
            [akvo.lumen.component.error-tracker :refer [local-error-tracker]]
            [akvo.lumen.lib.transformation.engine :refer (log-ex)]
            [akvo.lumen.test-utils :as test-utils]
            [akvo.lumen.test-utils
             :refer
             [import-file test-tenant test-tenant-conn]]
            [clojure.tools.logging :as log]
            [ragtime.jdbc :as jdbc]
            [ragtime.repl :as repl]))


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

(def ^:dynamic *tenant-conn*)

(defn tenant-conn-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  [f]
  (migrate-tenant test-tenant)
  (binding [*tenant-conn* (test-tenant-conn test-tenant)]
    (f)
    (rollback-tenant test-tenant)))

(def ^:dynamic *error-tracker*)

(defn error-tracker-fixture
  "Returns a fixture that binds a local error tracker to *error-tracker*"
  [f]
  (binding [*error-tracker* (local-error-tracker {})]
    (f)))

(def ^:dynamic *caddisfly*)

(defn caddisfly-fixture
  "Returns a fixture that binds a local error tracker to *error-tracker*"
  [f]
  (binding [*caddisfly* (caddisfly)]
    (f)))

(defn summarise-transformation-logs-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  [f]
  (with-redefs [log-ex (fn [ex] (log/info (.getMessage ex)))]
    (f)))
