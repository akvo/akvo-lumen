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
  (:require [akvo.lumen.admin.db :as admin.db]
            [akvo.lumen.admin.keycloak :as admin.keycloak]
            [akvo.lumen.admin.system :as admin.system]
            [akvo.lumen.admin.util :as util]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.config :refer [error-msg] :as config]
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.lib.user :as lib.user]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.util :refer [conform-email squuid]]
            [cheshire.core :as json]
            [clojure.java.browse :as browse]
            [clojure.pprint :refer [pprint]]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [environ.core :refer [env]]
            [integrant.core :as ig]
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
                      (str/join ", "  blacklist))
              {:label label}))

    (let [first-char (get label 0)]
      (and (not (Character/isDigit first-char)) (not (Character/isLetter first-char))))
    (throw
     (ex-info "First letter should be a character"
              {:label label}))

    (nil? (re-matches #"^[a-z0-9\-]+" label))
    (throw
     (ex-info "Label is only allowed to be a-z 0-9 or hyphen"
              {:label label}))

    (str/starts-with? label "dark-")
    (throw
     (ex-info "Label is not allowed to start with dark-"
              {:label label}))

    :else label))

(defn label [url]
  (-> url
      (str/split #"//")
      second
      (str/split #"\.")
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

(defn exec-mail [{:keys [emailer user-creds tenant-db auth-type url]}]
  (let [{:keys [user-id email tmp-password]} user-creds
        text-part (if (some? tmp-password)
                    (let [invite-id
                          (:id (util/exec! tenant-db
                                           {:return-keys true}
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

(defn new-tenant-db-pass []
  (str/replace (squuid) "-" ""))

(defn exec [{:keys [emailer authorizer dbs] :as administer} {:keys [url title email auth-type] :as data}]
  (binding [admin.db/env-vars (:root dbs)]
    (let [drop-if-exists? (boolean (:drop-if-exists? administer))
          {:keys [email label title url auth-type]} (conform-input url title email auth-type)
          {:keys [tenant-db] :as db-uris} (admin.db/db-uris label (new-tenant-db-pass) (-> dbs :lumen :password))
          _ (admin.db/setup-tenant-database label title (-> administer :db-settings :encryption-key) db-uris drop-if-exists?)
          {:keys [user-id email tmp-password] :as user-creds} (admin.keycloak/setup-tenant authorizer label email url  drop-if-exists?)]
      (exec-mail (merge administer {:user-creds user-creds
                                    :tenant-db tenant-db
                                    :auth-type auth-type
                                    :url url}))
      true)))

(defn -main [url title email & [auth-type edn-file]]
  (try
    (binding [keycloak/http-client-req-defaults (http.client/req-opts 50000)]
      (admin.system/ig-derives)
      (let [admin-system (admin.system/new-system (admin.system/new-config (or edn-file "akvo/lumen/prod.edn"))
                                                  (admin.system/ig-select-keys [:akvo.lumen.admin/add-tenant]))
            administer (:akvo.lumen.admin/add-tenant admin-system)]
        (exec administer {:url url :title title :email email :auth-type (or auth-type "keycloak")})))
    (catch java.lang.AssertionError e
      (prn (.getMessage e)))
    (catch Exception e
      (prn e)
      (prn (.getMessage e))
      (when (= (type e) clojure.lang.ExceptionInfo)
        (prn (ex-data e))))))

(defmethod ig/init-key :akvo.lumen.admin/add-tenant [_ {:keys [emailer auth-type] :as opts}]
  opts)
