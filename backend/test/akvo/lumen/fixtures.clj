(ns akvo.lumen.fixtures
  (:require [akvo.lumen.component.caddisfly-test :refer (caddisfly)]
            [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.utils.local-error-tracker :refer [local-error-tracker]]
            [akvo.lumen.migrate :as lumen-migrate]
            [akvo.lumen.lib.transformation.engine :refer (log-ex)]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.test-utils :as tu]
            [clojure.java.jdbc :as clojure.jdbc]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [ragtime.jdbc :as jdbc]
            [ragtime.reporter :as reporter]
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

(defn ensure-source-db-migration
  [tenant]
  (migrate-tenant tenant))

(defn copy-test-db
  [conn db-name]
  (clojure.jdbc/execute! conn
                         [(format "CREATE DATABASE %s
                             WITH OWNER = lumen
                               TEMPLATE = 'test_lumen_tenant_1'
                               ENCODING = 'UTF8'
                             LC_COLLATE = 'en_US.UTF-8'
                               LC_CTYPE = 'en_US.UTF-8';" db-name)]
                         {:transaction? false}))

(def ^:dynamic *tenant-conn*)
(def ^:dynamic *system*)

(defn system-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  ([f]
   (system-fixture nil nil f))
  ([config-edn f]
   (system-fixture config-edn nil f))
  ([config-edn more-ks f]
   (let [c (tu/start-config config-edn more-ks)]
     (binding [lumen-migrate/*reporter* reporter/silent]
       (lumen-migrate/migrate c)
       (binding [*system* (tu/start-system c)]
         (try
           (f)
           (finally
             (tu/halt-system *system*))))))))

(defn data-groups-future-fixture
  [f]
  (binding [import/*data-groups-future* false]
    (f)))

(defn tenant-conn-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  ([f]
   (tenant-conn-fixture nil nil f))
  ([config-edn more-ks f]
   (let [c (tu/start-config config-edn more-ks)
         source-tenant (-> c :akvo.lumen.migrate/migrate :seed :tenants first)
         new-db-name (format "test_%s" (System/currentTimeMillis))
         new-db-uri (str/replace (:db_uri source-tenant) "test_lumen_tenant_1" new-db-name)]
     (tu/seed c)
     (ensure-source-db-migration source-tenant)
     (copy-test-db {:connection-uri (:db_uri source-tenant)} new-db-name)
     (binding [*tenant-conn* (pool {:db_uri new-db-uri :label new-db-name})]
       (f)))))

(def ^:dynamic *error-tracker*)

(defn error-tracker-fixture
  "Returns a fixture that binds a local error tracker to *error-tracker*"
  [f]
  (binding [*error-tracker* (local-error-tracker)]
    (f)))

(def ^:dynamic *caddisfly*)

(defn caddisfly-fixture
  "Returns a fixture that binds a local caddisfly component"
  [f]
  (binding [*caddisfly* (caddisfly)]
    (f)))

(defn summarise-transformation-logs-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  [f]
  (with-redefs [log-ex (fn [ex] (log/info (.getMessage ex)))]
    (f)))
