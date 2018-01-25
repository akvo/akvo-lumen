(ns dev
  (:refer-clojure :exclude [test])
  (:require [akvo.lumen.endpoint]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.migrate :as lumen-migrate]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.repl :refer :all]
            [clojure.tools.namespace.repl :refer [refresh]]
            [com.stuartsierra.component :as component]
            [duct.generate :as gen]
            [duct.util.repl :refer [setup test cljs-repl] :as duct-repl]
            [duct.util.system :refer [load-system]]
            [reloaded.repl :refer [system init start stop go reset]])
  (:import [org.postgresql.util PSQLException PGobject]))

(defn new-system []
  (load-system (keep io/resource
                     ["akvo/lumen/system.edn" "dev.edn" "local.edn"])))

(when (io/resource "local.clj")
  (load "local"))

(gen/set-ns-prefix 'akvo.lumen)

(reloaded.repl/set-init! new-system)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Seed
;;;

(defn- seed-tenant
  "Helper function that will seed tenant to the tenants table."
  [db tenant]
  (try
    (let [{:keys [id]} (first (jdbc/insert! db "tenants" (update (dissoc tenant :plan)
                                                                 :db_uri #(aes/encrypt "secret" %))))]
      (jdbc/insert! db "plan" {:tenant id
                               :tier (doto (org.postgresql.util.PGobject.)
                                       (.setType "tier")
                                       (.setValue (:plan tenant)))}))
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

(defn migrate-and-seed []
  (migrate)
  (seed)
  (migrate))

(defn rollback
  ([] (lumen-migrate/rollback {}))
  ([args] (lumen-migrate/rollback args)))
