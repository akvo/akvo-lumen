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


(defn construct-system
  "Create a system definition."
  [sources bindings]
  (->> (map io/resource sources)
       (map #(read-config % bindings))
       (apply meta-merge)))


(defn load-migrations
  "From a system definition get migrations for tenant manager and tenants."
  [system]
  {:tenant-manager (ragtime-jdbc/load-resources
                    (get-in system [:config :app :migrations :tenant-manager]))
   :tenants        (ragtime-jdbc/load-resources
                    (get-in system [:config :app :migrations :tenants]))})


#_(defn load-migrations
  "From a system definition get migrations for tenant manager and tenants."
  [system]
  {:tenant-manager (ragtime-jdbc/load-resources
                    (get-in system [:config :ragtime :resource-path]))
   :tenants        (ragtime-jdbc/load-resources
                    (get-in system [:config :tenant-manager :resource-path]))})


(defn migrate
  "Migrate tenant manager and tenants."
  [system-definitions]
  (let [bindings {'http-port (Integer/parseInt (:port env "3000"))}
        system (construct-system system-definitions bindings)
        migrations (load-migrations system)
        tenant-manager-db {:connection-uri (get-in system [:config :db :uri])}]
    (do-migrate (ragtime-jdbc/sql-database tenant-manager-db)
                (:tenant-manager migrations))
    (doseq [tenant (all-tenants tenant-manager-db)]
      (do-migrate (ragtime-jdbc/sql-database {:connection-uri (:db_uri tenant)})
                  (:tenants migrations)))))
