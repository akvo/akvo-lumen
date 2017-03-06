(ns akvo.lumen.admin.add-tenant
  "The following env vars are assumed to be present:
  PGHOST,  PGDATABASE, PGUSER, PGPASSWORD
  These can be found in the ElephantSQL console for the appropriate instance
  Use this as follow
  $ env PGHOST=***.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** \\
    lein run -m akvo.lumen.admin.add-tenant <label> <description>"
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.util :refer [squuid]]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as s]
            [clojure.pprint :refer [pprint]]
            [environ.core :refer [env]]
            [ragtime.jdbc]
            [ragtime.repl]))


(defn migrate-tenant [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "akvo/lumen/migrations/tenants")}))

(def blacklist ["admin"
                "next"
                "stage"
                "test"
                "www"])

(defn conform-label
  "First fence on label names, uniques are enforced in db."
  [label]
  (cond
    (< (count label) 3)
    (throw (Exception. "To short label, should be 3 or more characters."))

    (not (empty? (set/intersection (set blacklist)
                                   #{label})))
    (throw (Exception. (format "Label in blacklist: [%s]"
                               (s/join ", "  blacklist))))

    :else label))

(defn setup-database
  [label title]
  (let [tenant (str "tenant_" label)
        tenant-password (s/replace (squuid) "-" "")
        db-uri (util/db-uri)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        tenant-db-uri (util/db-uri {:database tenant :user tenant :password tenant-password})
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
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;")
    (jdbc/insert! lumen-db-uri :tenants {:db_uri tenant-db-uri :label label :title title})
    (migrate-tenant tenant-db-uri)))


(defn setup-keycloak
  [label email]
  #_(throw (Exception. "Not implemented."))
  nil)


(defn -main [label title]
  (try
    (setup-database (conform-label label) title)
    (let [user-creds (setup-keycloak label "name@domain")]
      (pprint user-creds))
    (catch Exception e
      (prn (.getMessage e))
      (System/exit 0))))
