(ns akvo.lumen.admin.add-tenant
  "The following env vars are assumed to be present:
  LUMEN_ENCRYPTION_KEY, LUMEN_KEYCLOAK_URL, LUMEN_KEYCLOAK_CLIENT_SECRET, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD,
  LUMEN_EMAIL_PASSWORD, LUMEN_EMAIL_USER
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
        LUMEN_EMAIL_USER=https://*** LUMEN_EMAIL_PASSWORD=*** \\
        PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.add-tenant <url> <title> <email> <auth-type>
  "
  (:require [akvo.lumen.admin.new-plan :as new-plan]
            [akvo.lumen.admin.util :as util]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.config :refer [error-msg] :as config]
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.lib.share :refer [random-url-safe-string]]
            [akvo.lumen.lib.user :as lib.user]
            [akvo.lumen.migrate :as migrate]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.util :refer [conform-email squuid]]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [akvo.lumen.component.hikaricp :as hikaricp]
            [clojure.java.browse :as browse]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.set :as set]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [integrant.core :as ig]
            [ragtime.jdbc]
            [ragtime.repl]
            [selmer.parser :as selmer])
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

(defn setup-database
  [label title]
  (let [tenant (str "tenant_" (s/replace label "-" "_"))
        tenant-password (s/replace (squuid) "-" "")
        db-uri (util/db-uri)
        
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        tenant-db-uri (util/db-uri {:database tenant
                                    :user tenant
                                    :password tenant-password})
        tenant-db-uri-with-superuser (util/db-uri {:database tenant})
        dbs {:db-uri db-uri :lumen-db-uri lumen-db-uri :tenant-db-uri tenant-db-uri :tenant-db-uri-with-superuser tenant-db-uri-with-superuser}]
    (util/exec-no-transact! db-uri "CREATE ROLE \"%s\" WITH PASSWORD '%s' LOGIN;"
                tenant tenant-password)
    (util/exec-no-transact! db-uri
                (str "CREATE DATABASE %1$s "
                     "WITH OWNER = %1$s "
                     "TEMPLATE = template0 "
                     "ENCODING = 'UTF8' "
                     "LC_COLLATE = 'en_US.UTF-8' "
                     "LC_CTYPE = 'en_US.UTF-8';")
                tenant)
    (util/exec-no-transact! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;")
    (util/exec-no-transact! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec-no-transact! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (util/exec-no-transact! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;")
    (jdbc/insert! lumen-db-uri :tenants {:db_uri (aes/encrypt (:lumen-encryption-key env) tenant-db-uri)
                                         :label label :title title})
    (migrate/do-migrate (ragtime.jdbc/sql-database tenant-db-uri)
                        (ragtime.jdbc/load-resources "akvo/lumen/migrations/tenants"))
    (log/error :dbs dbs)
    dbs))


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

(defn conform-auth-type
  "Returns valid kw auth-type or throws."
  [v]
  (condp = v
    "keycloak" :keycloak
    "auth0" :auth0
    (throw (ex-info "auth-type not valid." {:auth-type v}))))

(defn conform-input [url title email auth-type]
  (let [url (conform-url url)]
    {:email (conform-email email)
     :label (label url)
     :title title
     :auth-type (conform-auth-type auth-type)
     :url url}))

(defn check-env-vars []
  (assert (:lumen-encryption-key env) (error-msg "Specify LUMEN_ENCRYPTION_KEY env var"))
  (assert (:lumen-keycloak-url env) (error-msg "Specify LUMEN_KEYCLOAK_URL env var"))
  (assert (:lumen-email-user env) (error-msg "Specify LUMEN_EMAIL_USER env var"))
  (assert (:lumen-email-password env) (error-msg "Specify LUMEN_EMAIL_PASSWORD env var"))
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
                               :akvo.lumen.monitoring/collector
                               :akvo.lumen.component.emailer/mailjet-v3-emailer]))]
    (pprint conf)
    (ig/load-namespaces conf)
    (ig/init conf)))

(defn tenant-conn* [dropwizard-registry tenant-label db-uri]
  (tenant-manager/pool {:db_uri              db-uri 
                        :dropwizard-registry dropwizard-registry
                        :label               tenant-label}))

(defn -main [url title email auth-type]
  (try
    (check-env-vars)
    (let [{:keys [email label title url auth-type]} (conform-input url title email auth-type)
          system (admin-system)
          authorizer (:akvo.lumen.component.keycloak/authorization-service system)
          emailer (:akvo.lumen.component.emailer/mailjet-v3-emailer system)
          dropwizard-registry (:akvo.lumen.monitoring/dropwizard-registry system)
          {:keys [tenant-db-uri]} (setup-database label title)
          {:keys [user-id email tmp-password] :as user-creds} (binding [keycloak/http-client-req-defaults (http.client/req-opts 50000)]
                                                                (setup-tenant-in-keycloak authorizer label email url))]
      (log/error "User Credentials:" [user-id email tmp-password])
      (let [text-part (if (some? tmp-password)
                        (let [invite-id
                              (:id (util/exec-no-transact-return!
                                    tenant-db-uri
                                    (format "INSERT INTO invite (email, expire, author) VALUES ('%s', '%s', '%s') RETURNING *;"
                                            email
                                            (lib.user/expire-time)
                                            (json/encode {:email "admin@akvo.org"}))))]
                          (selmer/render-file (format "akvo/lumen/email/%s/new_tenant_non_existent_user.txt" (name auth-type))
                                              {:email email
                                               :invite-id invite-id
                                               :tmp-password tmp-password
                                               :location url}))
                        (selmer/render-file (format "akvo/lumen/email/%s/new_tenant_existent_user.txt" (name auth-type))
                                            {:email email
                                             :location url}))]
        (p/send-email emailer [email] {"Subject" "Akvo Lumen invite"
                                       "Text-part" text-part}))
      #_(new-plan/exec label))
    (catch java.lang.AssertionError e
      (prn (.getMessage e)))
    (catch Exception e
      (prn e)
      (prn (.getMessage e))
      (when (= (type e) clojure.lang.ExceptionInfo)
        (prn (ex-data e))))))
