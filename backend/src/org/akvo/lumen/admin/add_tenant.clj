(ns org.akvo.lumen.admin.add-tenant
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [org.akvo.lumen.admin.util :as util]
            [org.akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

(defn migrate-tenant [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "org/akvo/lumen/migrations/tenants")}))

(defn -main [label title]
  (let [tenant (str "tenant_" label)
        tenant-password (s/replace (squuid) "-" "")
        db-uri (util/db-uri)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        tenant-db-uri (util/db-uri {:databse tenant :user tenant :password tenant-password})
        tenant-db-uri-with-superuser (util/db-uri {:database tenant})]
    (util/exec! db-uri "CREATE ROLE %s WITH PASSWORD '%s' LOGIN;" tenant tenant-password)
    (util/exec! db-uri
                (str "CREATE DATABASE %1$s "
                     "WITH OWNER = %1$s "
                     "TEMPLATE = template0 "
                     "ENCODING = 'UTF8' "
                     "LC_COLLATE = 'en_US.UTF-8' "
                     "LC_CTYPE = 'en_US.UTF-8';")
                tenant)
    (util/exec! tenant-db-uri-with-superuser "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (jdbc/insert! lumen-db-uri :tenants {:db_uri tenant-db-uri :label label :title title})
    (migrate-tenant tenant-db-uri)))
