(ns akvo.lumen.admin.util
  (:require [akvo.lumen.http.client :as http.client]
            [akvo.lumen.component.keycloak :as keycloak]
            [clojure.java.jdbc :as jdbc]
            [akvo.lumen.component.hikaricp :as hikaricp]
            [environ.core :refer [env]]))

(def http-client-req-defaults (http.client/req-opts 200000))

(defn exec-no-transact!
  "Execute SQL expression"
  [db-uri format-str & args]
  (jdbc/execute! db-uri
                 [(apply format format-str args)]
                 {:transaction? false}))

(defn exec-no-transact-return!
  "Execute SQL expression"
  [db-uri format-str & args]
  (jdbc/execute! db-uri
                 [(apply format format-str args)]
                 {:transaction? false
                  :return-keys true}))

(defn db-uri-db
  "Build a db uri string using standard PG environment variables as fallback"
  ([] (db-uri-db {}))
  ([{:keys [host database user password]
     :or {host (env :pg-host)
          database (env :pg-database)
          user (env :pg-user)
          password (env :pg-password)}}]
   (hikaricp/ssl-url
    (format "jdbc:postgresql://%s/%s?ssl=true&user=%s%s"
            host database user
            (if-not password #_(or (= host "localhost") (= host "postgres"))
              ""
              (format "&password=%s" password))))))

(defn role-name [label & [admin?]]
  (let [s (if admin? "akvo:lumen:%s:admin" "akvo:lumen:%s")]
    (format s label)))
