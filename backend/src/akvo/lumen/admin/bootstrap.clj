(ns akvo.lumen.admin.bootstrap
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [akvo.lumen.admin.util :as util]
            [akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

;; The following env vars are assumed to be present:
;; PGHOST,  PGDATABASE, PGUSER, PGPASSWORD
;; These can be found in the ElephantSQL console for the appropriate instance
;; Use this as follow
;; $ env PGHOST=***.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** \
;;     lein run -m akvo.lumen.admin.bootstrap

(defn migrate [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "akvo/lumen/migrations/tenant_manager")}))

(defn -main []
  (let [db-uri (util/db-uri-db)
        lumen-db-uri (util/db-uri-db {:database "lumen" :user "lumen"})]
    (util/exec-no-transact! db-uri "CREATE ROLE lumen WITH PASSWORD '%s' SUPERUSER LOGIN;" (env :pgpassword))
    (util/exec-no-transact! db-uri (str "CREATE DATABASE lumen "
                            "WITH OWNER = lumen "
                            "TEMPLATE = template0 "
                            "ENCODING = 'UTF8' "
                            "LC_COLLATE = 'en_US.UTF-8' "
                            "LC_CTYPE = 'en_US.UTF-8';"))
    (util/exec-no-transact! lumen-db-uri "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec-no-transact! lumen-db-uri "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (migrate lumen-db-uri)))
