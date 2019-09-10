(ns akvo.lumen.admin.add-tenant.db
  (:require [akvo.lumen.admin.util :as util]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [ragtime.jdbc :as r.jdbc]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.migrate :as migrate]))


(defn drop-tenant-db [root-db-uri tenant]
  (util/exec-no-transact! root-db-uri "DROP DATABASE IF EXISTS \"%s\" " tenant)
  (util/exec-no-transact! root-db-uri "DROP ROLE IF EXISTS \"%s\" " tenant))

(defn create-tenant-db [root-db-uri tenant tenant-password]
  (try
    (util/exec-no-transact! root-db-uri "CREATE ROLE \"%s\" WITH PASSWORD '%s' LOGIN;" tenant tenant-password)
    (util/exec-no-transact! root-db-uri (str "CREATE DATABASE %1$s "
                                        "WITH OWNER = %1$s "
                                        "TEMPLATE = template0 "
                                        "ENCODING = 'UTF8' "
                                        "LC_COLLATE = 'en_US.UTF-8' "
                                        "LC_CTYPE = 'en_US.UTF-8';") tenant)
    (catch Exception e
      (do
        (log/error e)
        (try (drop-tenant-db root-db-uri tenant)
             (catch Exception e))
        (throw e)))))

(defn configure-tenant-db [root-db-uri tenant root-tenant-db-uri tenant-db-uri]
  (try
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;")
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;")
    (migrate/do-migrate (r.jdbc/sql-database tenant-db-uri)
                        (r.jdbc/load-resources "akvo/lumen/migrations/tenants"))
    (catch Exception e
      (do
        (drop-tenant-db root-db-uri tenant)
        (log/error e)
        (throw e))))
  )

(defn drop-tenant-from-lumen-db [lumen-encryption-key lumen-db-uri label]
  (try
    (util/exec-no-transact! lumen-db-uri (format  "DELETE from tenants where label='%s'" label))
    (catch Exception e
      (do
        (log/error e)
        (throw e)))))

(defn add-tenant-to-lumen-db [lumen-encryption-key root-db-uri lumen-db-uri tenant-db-uri tenant label title]
  (try
    (drop-tenant-from-lumen-db lumen-encryption-key lumen-db-uri label)
    (jdbc/insert! lumen-db-uri :tenants {:db_uri (aes/encrypt lumen-encryption-key tenant-db-uri)
                                         :label label :title title})
    (catch Exception e
      (do
        (drop-tenant-from-lumen-db lumen-encryption-key lumen-db-uri tenant-db-uri)
        (drop-tenant-db root-db-uri tenant)
        (log/error e)
        (throw e)))))
