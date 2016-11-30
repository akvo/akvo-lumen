(ns org.akvo.lumen.admin.bootstrap
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [org.akvo.lumen.admin.util :as util]
            [org.akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

(defn migrate [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "org/akvo/lumen/migrations/tenant_manager")}))

(defn -main []
  (let [db-uri (util/db-uri)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})]
    (util/exec! db-uri "CREATE ROLE lumen WITH PASSWORD '%s' SUPERUSER LOGIN;" pg-password)
    (util/exec! db-uri (str "CREATE DATABASE lumen "
                            "WITH OWNER = lumen "
                            "TEMPLATE = template0 "
                            "ENCODING = 'UTF8' "
                            "LC_COLLATE = 'en_US.UTF-8' "
                            "LC_CTYPE = 'en_US.UTF-8';"))
    (util/exec! lumen-db-uri "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec! lumen-db-uri "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (migrate lumen-db-uri)))
