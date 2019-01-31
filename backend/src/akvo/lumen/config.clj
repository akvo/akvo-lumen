(ns akvo.lumen.config
  (:require [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [clojure.walk :as walk]
            [duct.core :as duct]
            [environ.core :refer [env]]
            [integrant.core :as ig]
            [meta-merge.core :refer [meta-merge]]))

;; init --/legacy code from duct.util.system (older version)
(defn- read-config [source bindings-fun]
  (->> source
       (walk/postwalk #(bindings-fun % %))))

(defn load-config
  ([sources]
   (load-config sources {}))
  ([sources bindings]
   (->> sources
        (map #(read-config % bindings))
        (apply meta-merge))))
;; end --/legacy code from duct.util.system (older version)

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
    (assert (:lumen-flow-api-url env) (error-msg "LUMEN_FLOW_API_URL"))))

(defn bindings []
  {
   ;;'db-uri (:lumen-db-url env "jdbc:postgresql://postgres/lumen?user=lumen&password=password&ssl=true")
;;   'caddisfly-schema-uri (:lumen-caddisfly-schema-uri env "https://akvoflow-public.s3.amazonaws.com/caddisfly-tests.json")
;;   'email-password (:lumen-email-password env)
;;   'email-user (:lumen-email-user env)
;;   'encryption-key (:lumen-encryption-key env)
;;   'exporter-api-url (:exporter-api-url env "http://localhost:3001")
   ;;   'file-upload-path (:lumen-file-upload-path env "/tmp/akvo/lumen")
   
;;   'flow-api-url (:lumen-flow-api-url env)
;;   'http-port (Integer/parseInt (:port env "3000"))
;;   'keycloak-client-id (:lumen-keycloak-client-id env "akvo-lumen-confidential")
;;   'keycloak-client-secret (:lumen-keycloak-client-secret env)
;;   'keycloak-public-client-id (:lumen-keycloak-public-client-id env "akvo-lumen")
;;   'keycloak-realm "akvo"
;;   'keycloak-url (:lumen-keycloak-url env)
;;   'piwik-site-id (:lumen-piwik-site-id env)
;;   'sentry-backend-dsn (:lumen-sentry-backend-dsn env)
;;   'sentry-client-dsn (:lumen-sentry-client-dsn env)
   })

(defn construct
  "Create a system definition."
  ([] (construct "akvo/lumen/config.edn" (bindings)))
  ([config-path bindings]
   (load-config [(duct/prep (duct/read-config (io/resource config-path)))] bindings)))

(defmethod ig/init-key :akvo.lumen.config [_ opts]
  (load-config [opts] (bindings)))

