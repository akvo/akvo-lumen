(ns user
  (:require [clojure.repl :refer :all]
            [clojure.tools.namespace.repl :refer [refresh]]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [com.stuartsierra.component :as component]
            [eftest.runner :as eftest]
            [meta-merge.core :refer [meta-merge]]
            [reloaded.repl :refer [system init start stop go reset]]
            [ring.middleware.stacktrace :refer [wrap-stacktrace]]
            [org.akvo.dash.config :as config]
            [org.akvo.dash.system :as system]
            [org.akvo.dash.migrate :as mig]))

(def dev-config
  {:app {:middleware [wrap-stacktrace]}})

(def config
  (meta-merge config/defaults
              config/environ
              dev-config))

(defn new-system []
  (into (system/new-system config)
        {}))

(ns-unmap *ns* 'test)

(defn test []
  (eftest/run-tests (eftest/find-tests "test") {:multithread? false}))

(defn migrate []
  (mig/migrate {:connection-uri (-> config :db :uri)}))

(defn rollback [& args]
  (mig/rollback {:connection-uri (-> config :db :uri)}
                (map read-string args)))

(defn- seed-tenant
  "Helper function that will seed tenant to the tenants table."
  [db tenant]
  (jdbc/insert! db "tenants" tenant))

(defn seed
  "At the moment only support seed of tenants table."
  []
  (doseq [tenant [{:db_uri "jdbc:postgresql://localhost/dash_tenant_1?user=dash&password=password"
                   :label  "t1"
                   :title  "Tenant 1"}
                  {:db_uri "jdbc:postgresql://localhost/dash_tenant_2?user=dash&password=password"
                   :label  "t2"
                   :title  "Tenant 2"}]]
    (seed-tenant {:connection-uri (-> config :db :uri)} tenant)))

(when (io/resource "local.clj")
  (load "local"))

(reloaded.repl/set-init! new-system)
