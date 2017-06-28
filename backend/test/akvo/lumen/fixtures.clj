(ns akvo.lumen.fixtures
  (:require [akvo.lumen.component.tenant-manager :as tm]
            [akvo.lumen.migrate :as migrate]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [hugsql.core :as hugsql]
            [ragtime
             [jdbc :as jdbc]
             [repl :as repl]]
            [reloaded.repl :refer [go stop]]))

#_(def config
    {:db {:uri "jdbc:postgresql://localhost/lumen?user=lumen&password=password"}})

(def test-tenant-spec
  (->> "seed.edn" io/resource slurp edn/read-string
       :tenant-manager :tenants
       first))

(def test-conn
  (tm/pool test-tenant-spec))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; DB setup / tear-down fixture
;;;

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
   (jdbc/sql-database {:connection-uri "jdbc:postgresql://localhost/lumen?user=lumen&password=password"})
   :migrations
   (jdbc/load-resources "akvo/lumen/migrations/tenant_manager")})

(defn migrate-user-manager []
  (repl/migrate (user-manager-ragtime-spec)))

(defn db-fixture
  "When we only want to have a migrated db and not run the system"
  [f]
  (rollback-tenant test-tenant-spec)
  (migrate-tenant test-tenant-spec)
  (f))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Running system fixture
;;;

(hugsql/def-db-fns "akvo/lumen/fixtures.sql")

#_(defn system-fixture
  "Starts the system and migrates, no setup or tear down."
  [f]
  (let [conn {:connection-uri (-> config :db :uri)}]
    (try
      (go)
      (migrate/migrate conn)
      (insert-tenant conn {:db_uri "jdbc:postgresql://localhost/test_lumen_tenant_1?user=lumen&password=password"
                           :label "t1"
                           :title "Tenant 1"})
      (insert-tenant conn {:db_uri "jdbc:postgresql://localhost/test_lumen_tenant_2?user=lumen&password=password"
                           :label "t2"
                           :title "Tenant 2"})
      (migrate/migrate conn)
      (f)
      (migrate/rollback conn [:all])
      (finally
        (stop)))))
