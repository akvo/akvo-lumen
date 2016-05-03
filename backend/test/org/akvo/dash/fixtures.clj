(ns org.akvo.dash.fixtures
  (:require
   [hugsql.core :as hugsql]
   [org.akvo.dash.migrate :as migrate]
   [reloaded.repl :refer [system stop go]]
   [user :refer [config]]))


(hugsql/def-db-fns "org/akvo/dash/fixtures.sql")


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
