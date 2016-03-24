(ns org.akvo.dash.migrate
  ""
  (:require
   [clojure.pprint :refer [pprint]]
   [hugsql.core :as hugsql]
   [ragtime.jdbc :as jdbc]
   [ragtime.repl :as repl]))

(hugsql/def-db-fns "org/akvo/dash/migrate.sql")

(defn do-migrate
  ""
  [path db-spec]
  (repl/migrate {:datastore  (jdbc/sql-database db-spec)
                 :migrations (jdbc/load-resources path)}))

(defn migrate
  ""
  [db-spec]
  ;; lord
  (do-migrate "migrations_lord" db-spec)

  ;; tenants
  (doseq [tenant (all-tenants db-spec)]
    (do-migrate "migrations_tenants"
                {:connection-uri (:db_uri tenant)})))
