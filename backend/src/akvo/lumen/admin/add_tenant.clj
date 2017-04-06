(ns akvo.lumen.admin.add-tenant
  "The following env vars are assumed to be present:
  KC_URL, KC_SECRET, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  The PG_* env vars can be found in the ElephantSQL console for the appropriate
  instance. KC_URL is the url to keycloak (without trailing /auth).
  KC_SECRET is the client secret found in the Keycloak admin at
  > Realms > Akvo > Clients > akvo-lumen-confidential > Credentials > Secret.
  Use this as follow
  $ env KC_URL=https://*** KC_SECRET=***
        PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.add-tenant <label> <description> <email>
  KC_URL is probably one of:
  - http://localhost:8080 for local development
  - https://login.akvo.org for production
  - https://kc.akvotest.org for the test environment"
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.config :refer [error-msg]]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.lib.share-impl :refer [random-url-safe-string]]
            [akvo.lumen.util :refer [squuid]]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.browse :as browse]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.set :as set]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [ragtime.jdbc]
            [ragtime.repl]))


(def blacklist ["admin"
                "deck"
                "ftp"
                "mail"
                "next"
                "smtp"
                "stage"
                "test"
                "www"])

(defn conform-label
  "First fence on label names, uniques are enforced in db."
  [label]
  (cond
    (< (count label) 3)
    (throw
     (ex-info "To short label, should be 3 or more characters."
              {:label label}))

    (contains? (set blacklist) label)
    (throw
     (ex-info (format "Label in blacklist: [%s]"
                      (s/join ", "  blacklist))
              {:label label}))

    :else label))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Database
;;;

(defn migrate-tenant [db-uri]
  (ragtime.repl/migrate
   {:datastore (ragtime.jdbc/sql-database db-uri)
    :migrations (ragtime.jdbc/load-resources "akvo/lumen/migrations/tenants")}))

(defn setup-database
  [label title]
  (let [tenant (str "tenant_" label)
        tenant-password (s/replace (squuid) "-" "")
        db-uri (util/db-uri)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        tenant-db-uri (util/db-uri {:database tenant :user tenant :password tenant-password})
        tenant-db-uri-with-superuser (util/db-uri {:database tenant})]
    (util/exec! db-uri "CREATE ROLE %s WITH PASSWORD '%s' LOGIN;" tenant tenant-password)
    (util/exec! db-uri
                (str "CREATE DATABASE %1$s "
                     "WITH OWNER = %1$s "
                     "TEMPLATE = template0 "
                     "ENCODING = 'UTF8' "
                     "LC_COLLATE = 'en_US.UTF-8' "
                     "LC_CTYPE = 'en_US.UTF-8';")
                tenant)
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (util/exec! tenant-db-uri-with-superuser
                "CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;")
    (jdbc/insert! lumen-db-uri :tenants {:db_uri tenant-db-uri :label label :title title})
    (migrate-tenant tenant-db-uri)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Keycloak
;;;

(defn root-group-id
  "Returns the id of group on path akvo/lumen"
  [request-headers api-root]
  (-> (client/get (format "%s/group-by-path/%s" api-root "akvo/lumen")
                  {:headers request-headers})
      :body json/decode (get "id")))

(defn create-group
  [request-headers api-root root-group-id role group-name]
  (client/post (format "%s/roles" api-root)
               {:body (json/encode {"name" role})
                :headers request-headers})
  (let [new-group-id (-> (client/post
                          (format "%s/groups/%s/children"
                                  api-root root-group-id)
                          {:body (json/encode {"name" group-name})
                           :headers request-headers})
                         :body json/decode (get "id"))
        available-roles (-> (client/get
                             (format "%s/groups/%s/role-mappings/realm/available"
                                     api-root root-group-id)
                             {:headers request-headers})
                            :body json/decode)
        role-id (-> (filter #(= role (get % "name"))
                            available-roles)
                    first
                    (get "id"))
        pair-resp (client/post
                   (format "%s/groups/%s/role-mappings/realm" api-root new-group-id)
                   {:body (json/encode [{"id" role-id
                                         "name" role
                                         "scopeParamRequired" false
                                         "composite" false
                                         "clientRole" false
                                         "containerId" "Akvo"}])
                    :headers request-headers})]
    new-group-id))

(defn create-new-user
  "Creates a new user and return a map containing email, and
   new user-id and temporary password."
  [request-headers api-root email]
  (let [tmp-password (random-url-safe-string 6)
        user-id (-> (client/post (format "%s/users" api-root)
                                 {:body (json/encode
                                         {"username" email
                                          "email" email
                                          "emailVerified" false
                                          "enabled" true})
                                  :headers request-headers})
                    (get-in [:headers "Location"])
                    (s/split #"/")
                    last)]
    (client/put (format "%s/users/%s/reset-password" api-root user-id)
                {:body (json/encode {"temporary" true
                                     "type" "password"
                                     "value" tmp-password})
                 :headers request-headers})
    {:email email
     :user-id user-id
     :tmp-password tmp-password}))

(defn user-representation
  [request-headers api-root email]
  (if-let [user (keycloak/fetch-user-by-email request-headers api-root email)]
    {:email email
     :user-id (get user "id")}
    (create-new-user request-headers api-root email)))

(defn setup-tenant-in-keycloak
  "Create two new groups as children to the akvo:lumen group"
  [label email]
  (let [{:keys [api-root] :as kc} (util/create-keycloak)
        request-headers (keycloak/request-headers kc)
        lumen-group-id (root-group-id request-headers api-root)
        tenant-id (create-group request-headers api-root lumen-group-id
                                (format "akvo:lumen:%s" label) label)
        tenant-admin-id (create-group request-headers api-root tenant-id
                                      (format "akvo:lumen:%s:admin" label)
                                      "admin")
        {:keys [user-id email tmp-password] :as user-rep}
        (user-representation request-headers api-root email)]
    (keycloak/add-user-to-group request-headers api-root user-id tenant-admin-id)
    user-rep))



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; New
;;;


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Main
;;;

(defn check-input []
  (assert (:kc-url env) (error-msg "Specify KC_URL env var"))
  (assert (:kc-secret env)
          (do
            (browse/browse-url
             (format "%s/auth/admin/master/console/#/realms/akvo/clients" (:kc-url env)))
            (error-msg "Specify KC_SECRET env var from the Keycloak admin opened in the browser window at Client (akvo-lumen-confidential) -> Credentials -> Secret.")))
  (assert (:pg-host env) (error-msg "Specify PG_HOST env var"))
  (assert (:pg-database env) (error-msg "Specify PG_DATABASE env var"))
  (assert (:pg-user env) (error-msg "Specify PG_USER env var"))
  (when (not (= (:pg-host env) "localhost"))
    (assert (:pg-password env) (error-msg "Specify PG_PASSWORD env var"))))

(defn -main [label title email]
  (try
    (check-input)
    (setup-database (conform-label label) title)
    (let [user-creds (setup-tenant-in-keycloak label email)]
      (println "User creds:")
      (pprint user-creds))
    (catch java.lang.AssertionError e
      (prn (.getMessage e))
      (System/exit 0))
    (catch Exception e
      (prn e)
      (prn (.getMessage e))
      (when (= (type e) clojure.lang.ExceptionInfo)
        (prn (ex-data e)))
      (System/exit 0))))
