(ns org.akvo.lumen.admin.add-tenant
  (:require [environ.core :refer [env]]
            [clojure.java.jdbc :as jdbc]
            [org.akvo.lumen.util :refer [squuid]]))

(defn -main [label title]
  (let [tenant (str "tenant_" label)
        tenant-password (clojure.string/replace (squuid) "-" "")
        db-uri (format "jdbc:postgresql://%s/%s?user=%s&password=%s" (env :pghost) (env :pgdatabase) (env :pguser) (env :pgpassword))

        tenant-db-uri (format "jdbc:postgresql://%s/%s?user=%s&password=%s" (env :pghost) tenant tenant tenant-password)]
    (jdbc/execute! db-uri
                   [(format "CREATE ROLE %s WITH PASSWORD '%s' LOGIN;"
                            tenant tenant-password)])
    (jdbc/execute! db-uri
                   [(format (str "CREATE DATABASE %s WITH OWNER "
                                 "= %s TEMPLATE = template0 "
                                 "ENCODING = 'UTF8' "
                                 "LC_COLLATE = 'en_US.UTF-8' "
                                 "LC_CTYPE = 'en_US.UTF-8';")
                            tenant tenant)])

    (jdbc/execute! db-uri
                   ["CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;"])
    (jdbc/execute! db-uri
                   ["CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;"])
    (jdbc/execute! db-uri
                   [(format (str "INSERT INTO tenants (db_uri, label, title)"
                                 "VALUES ('%s', '%s', '%s');")
                            db-uri label title)])))
