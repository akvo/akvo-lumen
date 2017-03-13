(ns akvo.lumen.admin.add-tenant
  "The following env vars are assumed to be present:
  KEYCLOAK, KEYCLOAK_SECRET These can be found in the Keycloak admin in the
  akvo-lumen-confidential client section.
  PGHOST, PGDATABASE, PGUSER, PGPASSWORD
  These can be found in the ElephantSQL console for the appropriate instance
  Use this as follow
  $ env KEYCLOAK=dev KEYCLOAK_ID=akvo-lumen-confidential KEYCLOAK_SECRET=*** \\
        PGHOST=***.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** \\
        lein run -m akvo.lumen.admin.add-tenant <label> <description> <email>"
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.lib.share-impl :refer [random-url-safe-string]]
            [akvo.lumen.util :refer [squuid]]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as s]
            [clojure.pprint :refer [pprint]]
            [environ.core :refer [env]]
            [ragtime.jdbc]
            [ragtime.repl]))


(def blacklist ["admin"
                "next"
                "stage"
                "test"
                "www"])

(defn conform-label
  "First fence on label names, uniques are enforced in db."
  [label]
  (cond
    (< (count label) 3)
    (throw (Exception. "To short label, should be 3 or more characters."))

    (not (empty? (set/intersection (set blacklist)
                                   #{label})))
    (throw (Exception. (format "Label in blacklist: [%s]"
                               (s/join ", "  blacklist))))

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
  [request-draft api-root]
  (-> (client/get (format "%s/group-by-path/%s" api-root "akvo/lumen")
                  request-draft)
      :body json/decode (get "id")))

(defn create-group
  [request-draft api-root root-group-id role group-name]
  (client/post (format "%s/roles" api-root)
               (assoc request-draft
                      :body (json/encode {"name" role})))
  (let [new-group-id (-> (client/post
                          (format "%s/groups/%s/children"
                                  api-root root-group-id)
                          (assoc request-draft
                                 :body (json/encode {"name" group-name})))
                         :body json/decode (get "id"))
        available-roles (-> (client/get
                             (format "%s/groups/%s/role-mappings/realm/available"
                                     api-root root-group-id)
                             request-draft)
                            :body json/decode)
        role-id (-> (filter #(= role (get % "name"))
                            available-roles)
                    first
                    (get "id"))
        pair-resp (client/post
                   (format "%s/groups/%s/role-mappings/realm" api-root new-group-id)
                   (assoc request-draft
                          :body (json/encode [{"id" role-id
                                               "name" role
                                               "scopeParamRequired" false
                                               "composite" false
                                               "clientRole" false
                                               "containerId" "Akvo"}])))]
    new-group-id))

(defn create-new-user
  [request-draft api-root email]
  (let [tmp-password (random-url-safe-string 6)
        user-id (-> (client/post (format "%s/users" api-root)
                                 (assoc request-draft
                                        :body (json/encode
                                               {"username" email
                                                "email" email
                                                "emailVerified" false
                                                "enabled" true})))
                    (get-in [:headers "Location"])
                    (s/split #"/")
                    last)]
    (client/put (format "%s/users/%s/reset-password" api-root user-id)
                (assoc request-draft
                       :body (json/encode {"temporary" true
                                           "type" "password"
                                           "value" tmp-password})))
    {:email email
     :user-id user-id
     :tmp-password tmp-password}))

(defn user-representation
  [request-draft api-root email]
  (if-let [{:strs [id] :as user} (keycloak/fetch-user-by-email request-draft
                                                               api-root email)]
    {:email email
     :user-id id}
    (create-new-user request-draft api-root email)))

(defn setup-keycloak
  [label email]
  (let [{api-root :api-root :as kc} (util/create-keycloak)
        request-draft (keycloak/request-draft kc)
        lumen-group-id (root-group-id request-draft api-root)
        tenant-id (create-group request-draft api-root lumen-group-id
                                (format "akvo:lumen:%s" label) label)
        tenant-admin-id (create-group request-draft api-root tenant-id
                                      (format "akvo:lumen:%s:admin" label)
                                      "admin")
        {:keys [user-id email tmp-password] :as user-rep}
        (user-representation request-draft api-root email)]
    (keycloak/add-user-to-group request-draft api-root user-id tenant-admin-id)
    user-rep))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Main
;;;

(defn -main [label title email]
  (try
    (setup-database (conform-label label) title)
    (let [user-creds (setup-keycloak label email)]
      (println "User creds:")
      (pprint user-creds))
    (catch Exception e
      (println "Got error")
      (prn (.getMessage e))
      (System/exit 0))))
