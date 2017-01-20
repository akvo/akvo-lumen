(ns akvo.lumen.config
  (:require [environ.core :refer [env]]))

(defn- error-msg [env-var]
  (format "Failed to setup binding: %s environment variable missing" env-var))

(defn assert-bindings []
  (assert (:lumen-db-url env) (error-msg "LUMEN_DB_URL"))
  (assert (:lumen-keycloak-url env) (error-msg "LUMEN_KEYCLOAK_URL"))
  (assert (:lumen-keycloak-user env) (error-msg "LUMEN_KEYCLOAK_USER"))
  (assert (:lumen-keycloak-password env) (error-msg "LUMEN_KEYCLOAK_PASSWORD"))
  (assert (:lumen-flow-report-database-url env) (error-msg "LUMEN_FLOW_REPORT_DATABASE_URL"))
  (assert (:lumen-file-upload-path env) (error-msg "LUMEN_FILE_UPLOAD_PATH")))

(defn bindings []
  {'db-uri (:lumen-db-url env)
   'http-port (Integer/parseInt (:port env "3000"))
   'keycloak-realm "akvo"
   'keycloak-client-id "akvo-lumen"
   'keycloak-url (:lumen-keycloak-url env)
   'keycloak-user (:lumen-keycloak-user env)
   'keycloak-password (:lumen-keycloak-password env)
   'flow-report-database-url (:lumen-flow-report-database-url env)
   'file-upload-path (:lumen-file-upload-path env)})
