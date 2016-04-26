(ns org.akvo.dash.fixtures
  (:require
   ;; [duct.component.ragtime :as ragtime]
   [hugsql.core :as hugsql]
   [meta-merge.core :refer [meta-merge]]
   [org.akvo.dash.migrate :as migrate]
   [org.akvo.dash.component.tenant-manager :refer [connection]]
   [org.akvo.dash.config :as config]
   [reloaded.repl :refer [system stop go]]
   [ring.middleware.stacktrace :refer [wrap-stacktrace]]))

(hugsql/def-db-fns "org/akvo/dash/fixtures.sql")

(def dev-config
  {:app {:middleware [wrap-stacktrace]}})

(def config
  (meta-merge config/defaults
              config/environ
              dev-config))
;(defn system-fixture
;  "Just a dummy fixture while we rework stuff"
;  [f]
;  (f))


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
      (migrate/rollback conn)
      (finally (stop)))))
