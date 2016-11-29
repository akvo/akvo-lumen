(ns org.akvo.lumen.admin.add-tenant
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [org.akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

(defn migrate-tenant [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "org/akvo/lumen/migrations/tenants")}))

(defn -main [label title]
  (let [{pg-host :pghost
         pg-database :pgdatabase
         pg-user :pguser
         pg-password :pgpassword} env
        tenant (str "tenant_" label)
        tenant-password (s/replace (squuid) "-" "")
        db-uri (format "jdbc:postgresql://%s/%s?user=%s&password=%s"
                       pg-host pg-database pg-user pg-password)
        lumen-db-uri (format "jdbc:postgresql://%s/lumen?user=lumen&password=%s"
                             pg-host pg-password)
        tenant-db-uri (format "jdbc:postgresql://%1$s/%2$s?user=%2$s&password=%3$s"
                              pg-host tenant tenant-password)
        exec! (fn [format-str & args]
                (jdbc/execute! db-uri [(apply format format-str args)]
                               {:transaction? false}))]
    (exec! "CREATE ROLE %s WITH PASSWORD '%s' LOGIN;" tenant tenant-password)
    (exec! (str "CREATE DATABASE %1$s "
                "WITH OWNER = %1$s "
                "TEMPLATE = template0 "
                "ENCODING = 'UTF8' "
                "LC_COLLATE = 'en_US.UTF-8' "
                "LC_CTYPE = 'en_US.UTF-8';")
           tenant)
    (exec! "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (exec! "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (jdbc/insert! lumen-db-uri :tenants {:db_uri tenant-db-uri :label label :title title})
    (migrate-tenant tenant-db-uri)))
