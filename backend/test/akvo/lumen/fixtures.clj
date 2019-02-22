(ns akvo.lumen.fixtures
  (:require [akvo.lumen.component.caddisfly-test :refer (caddisfly)]
            [akvo.lumen.component.error-tracker :refer [local-error-tracker]]
            [akvo.lumen.migrate :as lumen-migrate]
            [akvo.lumen.lib.transformation.engine :refer (log-ex)]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.test-utils :as tu]
            [akvo.lumen.test-utils
             :refer
             [import-file]]
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

(def ^:dynamic *tenant-conn*)
(def ^:dynamic *system*)

(defn system-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  [f]
  (let [c (tu/start-config)]
    (lumen-migrate/migrate c)
    (binding [*system* (tu/start-system)]
      (try
        (f)
        (finally (do
                   (tu/halt-system *system*)
                   (lumen-migrate/rollback c :tenant-manager)))))))


(defn tenant-conn-fixture
  "Returns a fixture that binds a connection pool to *tenant-conn*"
  [f]
  (let [c (tu/start-config)]
    (try
      (tu/seed c)
      (lumen-migrate/migrate c)
      (binding [*tenant-conn* (p/connection (:akvo.lumen.component.tenant-manager/tenant-manager *system*)
                                            (-> c :akvo.lumen.migrate/migrate :seed :tenants first :label))]
        (f))
      (finally (lumen-migrate/rollback c {})))))

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
