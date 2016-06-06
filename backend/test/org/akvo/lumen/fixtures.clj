(ns org.akvo.lumen.fixtures
  (:require [hugsql.core :as hugsql]
            [org.akvo.lumen.component.tenant-manager :as tm]
            [org.akvo.lumen.migrate :as migrate]
            [ragtime
             [jdbc :as jdbc]
             [repl :as repl]]
            [reloaded.repl :refer [go stop]]
            [user :refer [config]]))


(def test-tenant-spec
  (->> "profiles.clj" slurp read-string :profiles/test :env :tenants first))

;; (def test-tenant-spec
;;   (first (env :tenants)))

(def test-conn
  (tm/pool test-tenant-spec))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; DB setup / tear-down fixture
;;;

(defn- ragtime-spec
  [tenant]
  {:datastore  (jdbc/sql-database {:connection-uri (:db_uri tenant)})
   :migrations (jdbc/load-resources "org/akvo/lumen/migrations_tenants")})

(defn migrate-tenant
  [tenant]
  (repl/migrate (ragtime-spec tenant)))

(defn rollback-tenant
  [tenant]
  (let [spec (ragtime-spec tenant)]
    (repl/rollback spec (count (:migrations spec)))))

(defn db-fixture
  "When we only want to have a migrated db and not run the system"
  [f]
  (rollback-tenant test-tenant-spec)
  (migrate-tenant test-tenant-spec)
  (f))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Running system fixture
;;;

(hugsql/def-db-fns "org/akvo/lumen/fixtures.sql")

(defn system-fixture
  "Starts the system and migrates, no setup or tear down."
  [f]
  (let [conn {:connection-uri (-> config :db :uri)}]
    (try
      (go)
      (migrate/migrate conn)
      (insert-tenant conn {:db_uri "jdbc:postgresql://localhost/test_dash_tenant_1?user=dash&password=password"
                           :label "t1"
                           :title "Tenant 1"})
      (insert-tenant conn {:db_uri "jdbc:postgresql://localhost/test_dash_tenant_2?user=dash&password=password"
                           :label "t2"
                           :title "Tenant 2"})
      (migrate/migrate conn)
      (f)
      (migrate/rollback conn [:all])
      (finally (stop)))))
