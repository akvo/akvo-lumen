(ns akvo.lumen.admin.util
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.config :refer [error-msg]]
            [clojure.java.jdbc :as jdbc]
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
  ([{:keys [host database user password]
     :or {host (env :pghost)
          database (env :pgdatabase)
          user (env :pguser)
          password (env :pgpassword)}}]
   (format "jdbc:postgresql://%s/%s?user=%s&password=%s&ssl=true"
           host database user password)))

(defn- keycloak-url
  "Hardcoded urls, seemed like a fair thing to do."
  []
  (case (:keycloak env)
    "prod" "https://login.akvo.org/auth"
    "test" "https://kc.akvotest.org/auth"
    "dev" "http://localhost:8080/auth"))

(defn create-keycloak []
  (assert (:keycloak env) (error-msg "KEYCLOAK"))
  (assert (:keycloak-id env) (error-msg "KEYCLOAK_ID"))
  (assert (:keycloak-secret env) (error-msg "KEYCLOAK_SECRET"))
  (let [url (keycloak-url)
        issuer (format "%s/realms/akvo" url)]
    {:api-root (format "%s/admin/realms/akvo" url)
     :issuer issuer
     :openid-config (keycloak/fetch-openid-configuration issuer)
     :credentials {"client_id" (:keycloak-id env)
                   "client_secret" (:keycloak-secret env)}}))
