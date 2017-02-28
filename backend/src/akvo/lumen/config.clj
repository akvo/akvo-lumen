(ns akvo.lumen.config
  (:require [environ.core :refer [env]]))

(defn- error-msg [env-var]
  (format "Failed to setup binding: %s environment variable missing" env-var))

(defn assert-bindings []
  (assert (:lumen-db-url env) (error-msg "LUMEN_DB_URL"))
  (assert (:lumen-email-password env) (error-msg "LUMEN_EMAIL_PASSWORD"))
  (assert (:lumen-email-user env) (error-msg "LUMEN_EMAIL_USER"))
  (assert (:lumen-keycloak-client-secret env)
          (error-msg "LUMEN_KEYCLOAK_CLIENT_SECRET"))
  (assert (:lumen-keycloak-url env) (error-msg "LUMEN_KEYCLOAK_URL"))
  (assert (:lumen-flow-report-database-url env)
          (error-msg "LUMEN_FLOW_REPORT_DATABASE_URL"))
  (assert (:lumen-file-upload-path env) (error-msg "LUMEN_FILE_UPLOAD_PATH")))

(defn bindings []
  {'db-uri (:lumen-db-url env)
   'email-host (:lumen-email-host env)
   'email-password (:lumen-email-password env)
   'email-user (:lumen-email-user env)
   'file-upload-path (:lumen-file-upload-path env "/tmp/akvo/lumen")
   'flow-report-database-url (:lumen-flow-report-database-url env)
   'http-port (Integer/parseInt (:port env "3000"))
   'keycloak-client-id (:lumen-keycloak-client-id env "akvo-lumen-confidential")
   'keycloak-client-secret (:lumen-keycloak-client-secret env)
   'keycloak-public-client-id (:lumen-keycloak-public-client-id env "akvo-lumen")
   'keycloak-realm "akvo"
   'keycloak-url (:lumen-keycloak-url env)})
