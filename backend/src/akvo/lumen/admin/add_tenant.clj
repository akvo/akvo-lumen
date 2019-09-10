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
            [akvo.lumen.admin.add-tenant.db :as db]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.config :refer [error-msg] :as config]
            [akvo.lumen.admin.remove-tenant :as remove-tenant]
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.lib.share :refer [random-url-safe-string]]
            [akvo.lumen.lib.user :as lib.user]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.util :refer [conform-email squuid]]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [akvo.lumen.component.hikaricp :as hikaricp]
            [clojure.java.browse :as browse]
            [clojure.pprint :refer [pprint]]
            [clojure.set :as set]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [integrant.core :as ig]
            [selmer.parser :as selmer])
  (:import java.net.URL))

(def ^:dynamic env-vars
  (let [ks-mapping {:pg-host :host
                    :pg-database :database
                    :pg-user :user
                    :pg-password :password}]
    (set/rename-keys ks-mapping (select-keys env (keys ks-mapping)))))

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

(defn db-uri*
  ([] (db-uri* {}))
  ([data]
   (util/db-uri (merge env-vars data))))

(defn db-uris [label tenant-password & [lumen-db-password]]
  (let [tenant (str "tenant_" (s/replace label "-" "_"))
        main-db-uri (db-uri*)
        lumen-db-uri (db-uri* {:database "lumen" :user "lumen" :password lumen-db-password})
        tenant-db-uri (db-uri* {:database tenant
                                :user     tenant
                                :password tenant-password})
        tenant-db-uri-with-superuser (db-uri* {:database tenant})]
    {:root-db main-db-uri
     :lumen-db lumen-db-uri
     :tenant-db tenant-db-uri
     :root-tenant-db tenant-db-uri-with-superuser
     :tenant tenant
     :tenant-password tenant-password}))

(defn drop-tenant-database
  [lumen-encryption-key db-uris]
  (log/error :drop-tenant-database (:tenant db-uris))
  (let [{:keys [root-db lumen-db tenant-db root-tenant-db tenant tenant-password]} db-uris]
    (db/drop-tenant-from-lumen-db lumen-encryption-key lumen-db tenant-db)
    (db/drop-tenant-db root-db tenant)))

(defn setup-tenant-database
  [label title lumen-encryption-key db-uris]
  (drop-tenant-database lumen-encryption-key db-uris)
  (log/error :setup-tenant-database label title)
  (let [{:keys [root-db lumen-db tenant-db root-tenant-db tenant tenant-password]} db-uris]
    (db/create-tenant-db root-db tenant tenant-password)
    (db/configure-tenant-db root-db tenant root-tenant-db tenant-db)
    (db/add-tenant-to-lumen-db lumen-encryption-key root-db lumen-db tenant-db tenant label title)
    (log/error :setup-tenant-database-finished :dbs db-uris)
    true))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Keycloak
;;;

(defn user-representation
  [authorizer headers email]
  (if-let [user (keycloak/fetch-user-by-email headers (:api-root authorizer) email)]
    {:email email
     :user-id (get user "id")}
    (lib.user/create-new-account authorizer headers email)))

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
  (log/error :setup-tenant-in-keycloak label email url)
  (remove-tenant/cleanup-keycloak authorizer label)
  (let [headers (keycloak/request-headers authorizer)
        lumen-group-id (-> (keycloak/root-group authorizer headers)
                           (get "id"))
        tenant-id (keycloak/create-group authorizer headers lumen-group-id (util/role-name label) label)
        tenant-admin-id (keycloak/create-group authorizer headers tenant-id (util/role-name label true) "admin")
        {:keys [user-id email tmp-password] :as user-rep} (user-representation authorizer headers email)]
    (add-tenant-urls-to-clients authorizer headers url)
    (keycloak/add-user-to-group headers (:api-root authorizer) user-id tenant-admin-id)
    (log/error "User Credentials:" user-rep)
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

(defn ig-select-keys []
  [:akvo.lumen.component.emailer/mailjet-v3-emailer])

(defn ig-derives []
  (derive :akvo.lumen.component.emailer/mailjet-v3-emailer :akvo.lumen.component.emailer/emailer))

(defn admin-system
  ([]
   (admin-system (config/construct "akvo/lumen/config.edn") (ig-select-keys)))
  ([c ks]
   (let [conf (-> c
                  (select-keys (apply conj ks [:akvo.lumen.monitoring/dropwizard-registry
                                               :akvo.lumen.monitoring/collector
                                               :akvo.lumen.component.emailer/emailer
                                               :akvo.lumen.component.keycloak/authorization-service
                                               :akvo.lumen.component.keycloak/public-client
                                               :akvo.lumen.admin/add-tenant
                                               :akvo.lumen.component.tenant-manager/data])))]
     (ig/load-namespaces conf)
     (ig/init conf))))

(defn tenant-conn* [dropwizard-registry tenant-label db-uri]
  (tenant-manager/pool {:db_uri              db-uri 
                        :dropwizard-registry dropwizard-registry
                        :label               tenant-label}))

(defn exec-mail [{:keys [emailer user-creds tenant-db auth-type url]}]
  (let [{:keys [user-id email tmp-password]} user-creds
        text-part (if (some? tmp-password)
                    (let [invite-id
                          (:id (util/exec-no-transact-return! tenant-db
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
    (log/info :sending email text-part)
    (p/send-email emailer [email] {"Subject" "Akvo Lumen invite"
                                   "Text-part" text-part})))

(defn exec [{:keys [emailer authorizer] :as administer} {:keys [url title email auth-type] :as data}]
  (let [{:keys [email label title url auth-type]} (conform-input url title email auth-type)
        {:keys [tenant-db] :as db-uris} (db-uris label (s/replace (squuid) "-" ""))
        _ (setup-tenant-database (:encryption-key env) label title db-uris)
        {:keys [user-id email tmp-password] :as user-creds} (setup-tenant-in-keycloak authorizer label email url)]
    (exec-mail (merge administer {:user-creds user-creds
                                  :tenant-db tenant-db
                                  :auth-type auth-type
                                  :url url}))))

(defn -main [url title email auth-type]
  (try
    (check-env-vars)
    (binding [keycloak/http-client-req-defaults (http.client/req-opts 50000)]
      (exec (:akvo.lumen.admin/add-tenant (admin-system))
            {:url url :title title :email email :auth-type auth-type}))
    #_(new-plan/exec label)
    (catch java.lang.AssertionError e
      (prn (.getMessage e)))
    (catch Exception e
      (prn e)
      (prn (.getMessage e))
      (when (= (type e) clojure.lang.ExceptionInfo)
        (prn (ex-data e))))))


(defmethod ig/init-key :akvo.lumen.admin/add-tenant [_ {:keys [emailer auth-type] :as opts}]
  opts)
