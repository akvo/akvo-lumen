(ns org.akvo.lumen.admin.util
  (:require [clojure.java.jdbc :as jdbc]
            [environ.core :refer [env]]))

(defn exec!
  "Execute SQL expression"
  [db-uri format-str & args]
  (jdbc/execute! db-uri
                 [(apply format format-str args)]
                 {:transaction? false}))

(defn db-uri
  "Build a db uri string using standard PG environment variables as fallback"
  ([] (db-uri {}))
  ([{:keys [host user database password]
     :or {host (env :pghost)
          database (end :pgdatabase)
          user (env :pguser)
          password (env :pgpassword)}}]
   (format "jdbc:postgresql://%s/%s?user=%s&password=%s&sslmode=require"
           host database user password)))
