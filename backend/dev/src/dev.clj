(ns dev
  (:refer-clojure :exclude [test])
  (:require [clojure.edn :as edn]
            [clojure.repl :refer :all]
            [clojure.pprint :refer [pprint]]
            [clojure.tools.namespace.repl :refer [refresh]]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [com.stuartsierra.component :as component]
            [duct.generate :as gen]
            [duct.util.repl :refer [setup test cljs-repl] :as duct-repl]
            [duct.util.system :refer [load-system]]
            [org.akvo.lumen.migrate :as lumen-migrate]
            [reloaded.repl :refer [system init start stop go reset]])
  (:import  org.postgresql.util.PSQLException))

(defn new-system []
  (load-system (keep io/resource
                     ["org/akvo/lumen/system.edn" "dev.edn" "local.edn"])))

(when (io/resource "local.clj")
  (load "local"))

(gen/set-ns-prefix 'org.akvo.lumen)

(reloaded.repl/set-init! new-system)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Seed
;;;

(defn- seed-tenant
  "Helper function that will seed tenant to the tenants table."
  [db tenant]
  (try
    (jdbc/insert! db "tenants" tenant)
    (catch PSQLException e
      (println "Seed data already loaded."))))

(defn seed
  "At the moment only support seed of tenants table."
  []
  (let [db-uri (-> (lumen-migrate/construct-system)
                   :config :db :uri)]
    (doseq [tenant (->> "seed.edn" io/resource slurp edn/read-string
                         :tenant-manager :tenants)]
      (seed-tenant {:connection-uri db-uri} tenant))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Migrate
;;;

(defn migrate []
  (lumen-migrate/migrate))
