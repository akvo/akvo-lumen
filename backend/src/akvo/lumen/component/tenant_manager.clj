(ns akvo.lumen.component.tenant-manager
  "Component that controll the tenants,
  We use the first domain label e.g. t1 in t1.lumen.akvo.org to dispatch."
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aes :as aes]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [clojure.string :as str]
            [hugsql.core :as hugsql])
  (:import [com.zaxxer.hikari HikariConfig HikariDataSource]))

(hugsql/def-db-fns "akvo/lumen/component/tenant_manager.sql")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Middleware
;;;

(defn subdomain? [host]
  (>= (get (frequencies host) \.) 2))

(defn path-info? [expected-path-info {:keys [request-method path-info]}]
  (and (= request-method :get)
       (= path-info expected-path-info)))

(defn tenant-host [host]
  (-> host
      (str/replace-first #"^dark-" "")
      (str/split #"\.")
      first))

(defn wrap-label-tenant
  "Parses the first dns label as tenant id and adds it to the request map as
  tenant-id."
  [handler]
  (fn [req]
    (let [host (get-in req [:headers "host"])]
      (cond
        (path-info? "/healthz" req) (handler req)
        (path-info? "/metrics" req) (handler req)
        (subdomain? host) (handler (assoc req :tenant (tenant-host host)))
        :else (lib/bad-request "Not a tenant")))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Component
;;;

(defprotocol TenantConnection
  (connection [this label] "Connection based on a tenant dns label.")
  (uri [this label] "Database URI based on a tenant dns label."))

(defprotocol TenantAdmin
  (current-plan [this label] "Get the current plan."))

(defn pool
  "Created a Hikari connection pool."
  [{:keys [db_uri label dropwizard-registry]}]
  (let [minute (* 60 1000)
        cfg (doto
              (HikariConfig.)
              (.setJdbcUrl db_uri)
              (.setPoolName label)
              (.setMinimumIdle 0)
              (.setIdleTimeout (* 10 minute))
              (.setConnectionTimeout (* 10 1000))
              (.setMaximumPoolSize 10)
              (.setMetricRegistry dropwizard-registry))]
    {:datasource (HikariDataSource. cfg)}))

(defn assoc-if-key-does-not-exist [m k v]
  (if (contains? m k)
    m
    (assoc m k v)))

(defn load-tenant [db config tenants label]
  (if-let [{:keys [db_uri label]} (tenant-by-id (:spec db)
                                                {:label label})]
    (let [decrypted-db-uri (aes/decrypt (:encryption-key config) db_uri)]
      (swap! tenants
             assoc-if-key-does-not-exist
             label
             {::uri   decrypted-db-uri
              ::spec (delay (pool {:db_uri              decrypted-db-uri
                                   :dropwizard-registry (:dropwizard-registry config)
                                   :label               label}))}))
    (throw (Exception. "Could not match dns label with tenant from tenats."))))

(defrecord TenantManager [db config]
  TenantConnection
  (connection [{:keys [tenants]} label]
    (if-let [tenant (get @tenants label)]
      @(::spec tenant)
      (do
        (load-tenant db config tenants label)
        @(::spec (get @tenants label)))))

  (uri [{:keys [tenants]} label]
    (if-let [tenant (get @tenants label)]
      (::uri tenant)
      (do
        (load-tenant db config tenants label)
        (::uri (get @tenants label)))))

  TenantAdmin
  (current-plan [{:keys [db]} label]
    (:tier (select-current-plan (:spec db) {:label label}))))

(defn- tenant-manager [options]
  (map->TenantManager options))

(defmethod ig/init-key :akvo.lumen.component.tenant-manager [_ {:keys [db config] :as opts}]
  (let [this (tenant-manager (assoc config :db db))]
    (if (:tenants this)
      this
      (assoc this :tenants (atom {})))))

(defmethod ig/halt-key! :akvo.lumen.component.tenant-manager [_ this]
  (if-let [tenants (:tenants this)]
    (do
      (doseq [[_ {spec ::spec}] @tenants]
        (when (realized? spec)
          (.close (:datasource @spec))))
      (dissoc this :tenants))
    this))
