(ns akvo.lumen.admin.db
  (:require [akvo.lumen.admin.util :as util]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.set :as set]
            [ragtime.jdbc :as r.jdbc]
            [akvo.lumen.lib.aes :as aes]
            [environ.core :refer [env]]
            [akvo.lumen.migrate :as migrate]))

(def ^:dynamic env-vars
  (let [ks-mapping {:pg-host :host
                    :pg-database :database
                    :pg-user :user
                    :pg-password :password}]
    (set/rename-keys ks-mapping (select-keys env (keys ks-mapping)))))


(defn db-uri*
  ([] (db-uri* {}))
  ([data]
   (util/db-uri-db (merge env-vars data))))

(defn db-uris [label tenant-password & [lumen-db-password]]
  (let [tenant (str "tenant_" (str/replace label "-" "_"))
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


(defn- drop-tenant-db [root-db-uri tenant]
  (try
    (util/exec-no-transact! root-db-uri "DROP DATABASE IF EXISTS \"%s\" " tenant)
    (catch Exception e (let [message (.getMessage e)]
                         (log/error e)
                         (if (str/includes? message "is being accessed by other users")
                           (throw (ex-info (format "Right now it's not possible to drop the database %s, there are still active connections to this db, don't hit the web application related, wait for a few minutes, then try again" tenant) {:tenant tenant} e))
                           (throw e)))))
  (util/exec-no-transact! root-db-uri "DROP ROLE IF EXISTS \"%s\" " tenant))

(defn- create-tenant-db [root-db-uri root-tenant-db-uri tenant-db-uri  tenant tenant-password drop-if-exists?]
  (try
    (util/exec-no-transact! root-db-uri "CREATE ROLE \"%s\" WITH PASSWORD '%s' LOGIN;" tenant tenant-password)
    (util/exec-no-transact! root-db-uri (str "CREATE DATABASE %1$s "
                                             "WITH OWNER = %1$s "
                                             "TEMPLATE = template0 "
                                             "ENCODING = 'UTF8' "
                                             "LC_COLLATE = 'en_US.UTF-8' "
                                             "LC_CTYPE = 'en_US.UTF-8';") tenant)
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;")
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;")
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
    (util/exec-no-transact! root-tenant-db-uri
                            "CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;")
    (migrate/do-migrate (r.jdbc/sql-database tenant-db-uri)
                        (r.jdbc/load-resources "akvo/lumen/migrations/tenants"))
    (catch Exception e
      (do
        (log/error e)
        (try (when drop-if-exists?
               (drop-tenant-db root-db-uri tenant))
             (catch Exception e (do (log/error e) e)))
        (throw (ex-info "seems that the database you try to create already exists, try to use :drop-if-exists? true if you want to recreate it" {:current-values {:tenant tenant
                                                                                                                                                                  :drop-if-exists? drop-if-exists?}} e))))))

(defn- drop-tenant-from-lumen-db [lumen-db-uri label]
  (log/error :lumen-db-uri lumen-db-uri)
  (try
    (util/exec-no-transact! lumen-db-uri (format  "DELETE from tenants where label='%s'" label))
    (catch Exception e
      (do
        (log/error e)
        (throw e)))))

(defn- add-tenant-to-lumen-db [lumen-encryption-key root-db-uri lumen-db-uri tenant-db-uri tenant label title drop-if-exists?]
  (try
    (when drop-if-exists? (drop-tenant-from-lumen-db lumen-db-uri label))
    (jdbc/insert! lumen-db-uri :tenants {:db_uri (aes/encrypt lumen-encryption-key tenant-db-uri)
                                         :label label :title title})
    (catch Exception e
      (do
        (when drop-if-exists?
          (drop-tenant-from-lumen-db lumen-db-uri label)
          (drop-tenant-db root-db-uri tenant))
        (log/error e)
        (throw e)))))

(defn drop-tenant-database
  [label db-uris]
  (log/info :drop-tenant-database (:tenant db-uris))
  (let [{:keys [root-db lumen-db tenant-db root-tenant-db tenant tenant-password]} db-uris]
    (log/info :drop-tenant-from-lumen-db :label label (drop-tenant-from-lumen-db lumen-db label))
    (log/info :drop-tenant-db (drop-tenant-db root-db tenant))))

(defn setup-tenant-database
  [label title lumen-encryption-key db-uris drop-if-exists?]
  (when drop-if-exists? (drop-tenant-database label db-uris))
  (log/info :setup-tenant-database :label label :drop-if-exists? drop-if-exists? :title title :db-uris db-uris)
  (let [{:keys [root-db lumen-db tenant-db root-tenant-db tenant tenant-password]} db-uris]
    (create-tenant-db root-db root-tenant-db tenant-db tenant tenant-password drop-if-exists?)
    (add-tenant-to-lumen-db lumen-encryption-key root-db lumen-db tenant-db tenant label title drop-if-exists?)
    true))
