(ns akvo.lumen.config
  (:require [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [duct.core :as duct]
            [integrant.core :as ig]
            [environ.core :refer [env]]))

(defn error-msg [env-var]
  (format "Failed to setup binding: %s environment variable missing" env-var))

(defn assert-bindings []
  (assert (:lumen-db-url env) (error-msg "LUMEN_DB_URL"))
  (assert (:lumen-encryption-key env) (error-msg "LUMEN_ENCRYPTION_KEY"))
  (assert (:lumen-keycloak-client-secret env)
          (error-msg "LUMEN_KEYCLOAK_CLIENT_SECRET"))
  (assert (:lumen-keycloak-url env) (error-msg "LUMEN_KEYCLOAK_URL"))
  (assert (:lumen-file-upload-path env) (error-msg "LUMEN_FILE_UPLOAD_PATH"))
  (when-not (= "yes" (:ci-build env))
    (assert (:lumen-email-password env) (error-msg "LUMEN_EMAIL_PASSWORD"))
    (assert (:lumen-email-user env) (error-msg "LUMEN_EMAIL_USER"))
    (assert (:lumen-sentry-backend-dsn env) (error-msg "LUMEN_SENTRY_BACKEND_DSN"))
    (assert (:lumen-sentry-client-dsn env) (error-msg "LUMEN_SENTRY_CLIENT_DSN"))
    (assert (:lumen-flow-api-url env) (error-msg "LUMEN_FLOW_API_URL"))
    (assert (:lumen-flow-api-auth0-url env) (error-msg "LUMEN_FLOW_API_AUTH0_URL"))))

(defn construct
  "Create a system definition."
  ([] (construct "akvo/lumen/config.edn"))
  ([config-path]
   (ig/prep (duct/read-config (io/resource config-path)))))


