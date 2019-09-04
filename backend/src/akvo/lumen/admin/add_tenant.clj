(ns akvo.lumen.admin.add-tenant
  "The following env vars are assumed to be present:
  LUMEN_ENCRYPTION_KEY, LUMEN_KEYCLOAK_URL, LUMEN_KEYCLOAK_CLIENT_SECRET, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  
  LUMEN_ENCRYPTION_KEY is a key specific for the Kubernetes environment used for
  encrypting the db_uri which can be found in the lumen secret in K8s.

  The PG_* env vars can be found in the ElephantSQL console for the appropriate
  instance.

  LUMEN_KEYCLOAK_URL is the url to keycloak (with trailing /auth). Probably one of:
  - http://localhost:8080 for local development
  - https://login.akvo.org for production
  - https://kc.akvotest.org for the test environment

  LUMEN_KEYCLOAK_CLIENT_SECRET is the client secret found in the Keycloak admin at:
  > Realms > Akvo > Clients > akvo-lumen-confidential > Credentials > Secret.
  
  Use this as follow
  $ env LUMEN_ENCRYPTION_KEY=*** \\
        LUMEN_KEYCLOAK_URL=https://*** LUMEN_KEYCLOAK_CLIENT_SECRET=*** \\
        PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.add-tenant <url> <title> <email>
  "
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.config :refer [error-msg] :as config]
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.lib.share :refer [random-url-safe-string]]
            [akvo.lumen.util :refer [conform-email squuid]]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [clojure.java.browse :as browse]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.set :as set]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [integrant.core :as ig]
            [ragtime.jdbc]
            [ragtime.repl])
  (:import java.net.URL))

(def blacklist #{"admin"
                 "console"
                 "deck"
                 "ftp"
                 "mail"
                 "next"
                 "smtp"
                 "stage"
                 "test"
                 "www"})

(defn conform-label
  "First fence on label names, uniques are enforced in db."
  [label]
  (cond
    (< (count label) 3)
    (throw
     (ex-info "Too short label, should be 3 or more characters."
              {:label label}))

    (> (count label) 30)
    (throw
     (ex-info "Too long label, should be less than 30 or more characters."
              {:label label}))

    (contains? blacklist label)
    (throw
     (ex-info (format "Label in blacklist: [%s]"
                      (s/join ", "  blacklist))
              {:label label}))

    (not (Character/isLetter (get label 0)))
    (throw
     (ex-info "First letter should be a character"
              {:label label}))

    (nil? (re-matches #"^[a-z0-9\-]+" label))
    (throw
     (ex-info "Label is only allowed to be a-z 0-9 or hyphen"
              {:label label}))

    (s/starts-with? label "dark-")
    (throw
     (ex-info "Label is not allowed to start with dark-"
              {:label label}))

    :else label))

(defn label [url]
  (-> url
      (s/split #"//")
      second
      (s/split #"\.")
      first
      conform-label))

(defn conform-url
  "Make sure https is used for non development mode and remove trailing slash."
  [v]
  (let [url (URL. v)]
    (if (or (= (:kc-url env) "http://localhost:8080")
            (= (:kc-url env) "http://keycloak:8080"))
      (when (= (.getProtocol url) "https")
        (throw (ex-info "Use http in development mode" {:url v})))
      (when (not= (.getProtocol url) "https")
        (throw (ex-info "Url should use https" {:url v}))))
    (format "%s://%s" (.getProtocol url) (.getHost url))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Database
;;;

(defn migrate-tenant [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "akvo/lumen/migrations/tenants")}))

(defn setup-database
  [label title]
  (let [tenant (str "tenant_" (s/replace label "-" "_"))
        tenant-password (s/replace (squuid) "-" "")
        db-uri (util/db-uri)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        tenant-db-uri (util/db-uri {:database tenant
                                    :user tenant
                                    :password tenant-password})
        tenant-db-uri-with-superuser (util/db-uri {:database tenant})]
    (util/exec! db-uri "CREATE ROLE \"%s\" WITH PASSWORD '%s' LOGIN;"
                tenant tenant-password)
    (util/exec! db-uri
                (str "CREATE DATABASE %1$s "
                     "WITH OWNER = %1$s "
                     "TEMPLATE = template0 "
                     "ENCODING = 'UTF8' "
                     "LC_COLLATE = 'en_US.UTF-8' "
                     "LC_CTYPE = 'en_US.UTF-8';")
                tenant)
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;")
    (jdbc/insert! lumen-db-uri :tenants {:db_uri (aes/encrypt (:lumen-encryption-key env) tenant-db-uri)
                                         :label label :title title})
    (migrate-tenant tenant-db-uri)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Keycloak
;;;

(defn create-new-user
  "Creates a new user and return a map containing email, and
   new user-id and temporary password."
  [authorizer headers email]
  (let [tmp-password (random-url-safe-string 6)
        user-id (-> (p/create-user authorizer headers email)
                    (get-in [:headers "Location"])
                    (s/split #"/")
                    last)]
    (p/reset-password authorizer headers user-id tmp-password)
    {:email email
     :user-id user-id
     :tmp-password tmp-password}))

(defn user-representation
  [authorizer headers email]
  (if-let [user (keycloak/fetch-user-by-email headers (:api-root authorizer) email)]
    {:email email
     :user-id (get user "id")}
    (create-new-user authorizer headers email)))

(defn add-tenant-urls-to-client
  [client url]
  (-> client
      (update "webOrigins" conj url)
      (update "redirectUris" conj (format "%s/*" url))))

(defn add-tenant-urls-to-clients
  [authorizer headers url]
  (let [confidential-client (keycloak/fetch-client authorizer headers "akvo-lumen-confidential")
        public-client (keycloak/fetch-client authorizer headers "akvo-lumen")]
    (keycloak/update-client authorizer headers (add-tenant-urls-to-client confidential-client url))
    (keycloak/update-client authorizer headers (add-tenant-urls-to-client public-client url))))

(defn setup-tenant-in-keycloak
  "Create two new groups as children to the akvo:lumen group"
  [authorizer label email url]
  (let [headers (keycloak/request-headers authorizer)
        lumen-group-id (-> (keycloak/root-group authorizer headers)
                           (get "id"))
        tenant-id (keycloak/create-group authorizer headers lumen-group-id (format "akvo:lumen:%s" label) label)
        tenant-admin-id (keycloak/create-group authorizer headers tenant-id (format "akvo:lumen:%s:admin" label) "admin")
        {:keys [user-id email tmp-password] :as user-rep} (user-representation authorizer headers email)]
    (add-tenant-urls-to-clients authorizer headers url)
    (keycloak/add-user-to-group headers (:api-root authorizer) user-id tenant-admin-id)
    (assoc user-rep :url url)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Main
;;;

(defn conform-input [url title email]
  (let [url (conform-url url)]
    {:email (conform-email email)
     :label (label url)
     :title title
     :url url}))

(defn check-env-vars []
  (assert (:lumen-encryption-key env) (error-msg "Specify LUMEN_ENCRYPTION_KEY env var"))
  (assert (:lumen-keycloak-url env) (error-msg "Specify LUMEN_KEYCLOAK_URL env var"))
  (assert (:lumen-keycloak-client-secret env)
          (do
            (browse/browse-url
             (format "%s/auth/admin/master/console/#/realms/akvo/clients" (:kc-url env)))
            (error-msg "Specify LUMEN_KEYCLOAK_CLIENT_SECRET env var from the Keycloak admin opened in the browser window at Client (akvo-lumen-confidential) -> Credentials -> Secret.")))
  (assert (:pg-host env) (error-msg "Specify PG_HOST env var"))
  (assert (:pg-database env) (error-msg "Specify PG_DATABASE env var"))
  (assert (:pg-user env) (error-msg "Specify PG_USER env var"))
  (when (not (= (:pg-host env) "localhost"))
    (assert (:pg-password env) (error-msg "Specify PG_PASSWORD env var"))))

(defn admin-system []
  (let [conf (-> (config/construct "akvo/lumen/config.edn")
                 (select-keys [:akvo.lumen.component.keycloak/authorization-service
                               :akvo.lumen.component.keycloak/public-client
                               :akvo.lumen.monitoring/dropwizard-registry
                               :akvo.lumen.monitoring/collector]))]
    (pprint conf)
    (ig/load-namespaces conf)
    (ig/init conf)))

(defn -main [url title email]
  (try
    (check-env-vars)
    (let [{:keys [email label title url]} (conform-input url title email)
          authorizer (:akvo.lumen.component.keycloak/authorization-service (admin-system))]
      (setup-database label title)
      (let [user-creds (setup-tenant-in-keycloak authorizer label email url)]
        (println "Credentials:")
        (pprint user-creds)
        (println "Remember to add a new plan to the new tenant.")))
    (catch java.lang.AssertionError e
      (prn (.getMessage e)))
    (catch Exception e
      (prn e)
      (prn (.getMessage e))
      (when (= (type e) clojure.lang.ExceptionInfo)
        (prn (ex-data e))))))
