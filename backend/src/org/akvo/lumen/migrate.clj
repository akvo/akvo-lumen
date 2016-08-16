(ns org.akvo.lumen.migrate
  (:require
   [clojure.java.io :as io]
   ;; [duct.util.repl :as duct-repl]
   [duct.util.system :refer [read-config]]
   [environ.core :refer [env]]
   [hugsql.core :as hugsql]
   [meta-merge.core :refer [meta-merge]]
   [ragtime
    [jdbc :as ragtime-jdbc]
    [repl :as ragtime-repl]]))

(hugsql/def-db-fns "org/akvo/lumen/migrate.sql")


(defn do-migrate [datastore migrations]
  (ragtime-repl/migrate {:datastore datastore
                         :migrations migrations}))

(defn debug-configs
  [sources]
  (let [config-files (map io/resource sources)
        configs (map #(read-config % {}) config-files)]
    (println "@debug-configs")
    (prn config-files)
    (prn configs)))

(defn construct-system
  "Create a system definition."
  ([] (construct-system ["org/akvo/lumen/system.edn" "dev.edn"
                         ;; "local.edn"
                         ] {}))
  ([sources bindings]
   (debug-configs sources)
   (->> (map io/resource sources)
        (map #(read-config % bindings))
        (apply meta-merge))))


(defn load-migrations
  "From a system definition get migrations for tenant manager and tenants."
  [system]
  {:tenant-manager (ragtime-jdbc/load-resources
                    (get-in system [:config :app :migrations :tenant-manager]))
   :tenants        (ragtime-jdbc/load-resources
                    (get-in system [:config :app :migrations :tenants]))})


(defn migrate
  "Migrate tenant manager and tenants."
  ([] (migrate ["org/akvo/lumen/system.edn" "dev.edn" "local.edn"]))
  ([system-definitions]
   (let [bindings {'http-port (Integer/parseInt (:port env "3000"))}
         system (construct-system system-definitions bindings)
         migrations (load-migrations system)
         tenant-manager-db {:connection-uri (get-in system [:config :db :uri])}]
     (do-migrate (ragtime-jdbc/sql-database tenant-manager-db)
                 (:tenant-manager migrations))
     (doseq [tenant (all-tenants tenant-manager-db)]
       (do-migrate (ragtime-jdbc/sql-database {:connection-uri (:db_uri tenant)})
                   (:tenants migrations))))))


(defn migrate-tenant
  [tenant-conn]
  (let [system (construct-system)
        migrations (load-migrations system)]
    (do-migrate (ragtime-jdbc/sql-database tenant-conn)
                (:tenants migrations))))


(defn do-rollback [datastore migrations]
  (ragtime-repl/rollback {:datastore  datastore :migrations migrations}
                         (count migrations)))

#_(defn rollback
  []
  (let [tenants (env :tenants)]
    (println "@rollback")
    (clojure.pprint/pprint tenants)
    ))
