(ns org.akvo.lumen.admin.bootstrap
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [org.akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

(defn migrate [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "org/akvo/lumen/migrations/tenant_manager")}))

(defn -main []
  (let [{pg-host :pghost
         pg-database :pgdatabase
         pg-user :pguser
         pg-password :pgpassword} env
        db-uri (format "jdbc:postgresql://%s/%s?user=%s&password=%s"
                       pg-host pg-database pg-user pg-password)
        lumen-db-uri (format "jdbc:postgresql://%s/lumen?user=lumen&password=%s"
                             pg-host pg-password)
        exec! (fn [db-uri format-str & args]
                (jdbc/execute! db-uri
                               [(apply format format-str args)]
                               {:transaction? false}))]
    (exec! db-uri "CREATE ROLE lumen WITH PASSWORD '%s' SUPERUSER LOGIN;" pg-password)
    (exec! db-uri (str "CREATE DATABASE lumen "
                       "WITH OWNER = lumen "
                       "TEMPLATE = template0 "
                       "ENCODING = 'UTF8' "
                       "LC_COLLATE = 'en_US.UTF-8' "
                       "LC_CTYPE = 'en_US.UTF-8';"))
    (exec! lumen-db-uri "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (exec! lumen-db-uri "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (migrate lumen-db-uri)))
