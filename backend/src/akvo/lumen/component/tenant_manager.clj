(ns akvo.lumen.component.tenant-manager
  "Component that controll the tenants,
  We use the first domain label e.g. t1 in t1.lumen.akvo.org to dispatch."
  (:require [akvo.lumen.component.hikaricp :as hikaricp]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.monitoring :as monitoring]
            [akvo.lumen.protocols :as p]
            [clojure.spec.alpha :as s]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]
            [integrant.core :as ig])
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

(defn load-tenant [db encryption-key dropwizard-registry tenants label]
  (if-let [{:keys [db_uri label]} (tenant-by-id (:spec db)
                                                {:label label})]
    (let [decrypted-db-uri (aes/decrypt encryption-key db_uri)]
      (swap! tenants
             assoc-if-key-does-not-exist
             label
             {::uri  decrypted-db-uri
              ::spec (delay (pool {:db_uri              decrypted-db-uri
                                   :dropwizard-registry dropwizard-registry
                                   :label               label}))}))
    (throw (Exception. "Could not match dns label with tenant from tenats."))))

(defn get-or-create-tenant [db encryption-key dropwizard-registry tenants label]
  (if-let [tenant (get @tenants label)]
    tenant
    (->
      (load-tenant db encryption-key dropwizard-registry tenants label)
      (get label))))

(defrecord TenantManager [db encryption-key dropwizard-registry]
  p/TenantConnection
  (connection [{:keys [tenants]} label]
    @(::spec (get-or-create-tenant db encryption-key dropwizard-registry tenants label)))

  (uri [{:keys [tenants]} label]
    (::uri (get-or-create-tenant db encryption-key dropwizard-registry tenants label)))

  p/TenantAdmin
  (current-plan [{:keys [db]} label]
    (:tier (select-current-plan (:spec db) {:label label}))))

(defn- tenant-manager [options]
  (map->TenantManager options))

(defmethod ig/init-key :akvo.lumen.component.tenant-manager/tenant-manager [_ {:keys [db encryption-key dropwizard-registry] :as opts}]
  (let [this (tenant-manager opts)]
    (if (:tenants this)
      this
      (assoc this :tenants (atom {})))))

(defmethod ig/halt-key! :akvo.lumen.component.tenant-manager/tenant-manager [_ this]
  (if-let [tenants (:tenants this)]
    (do
      (doseq [[_ {spec ::spec}] @tenants]
        (when (realized? spec)
          (.close (:datasource @spec))))
      (dissoc this :tenants))
    this))

(s/def ::db ::hikaricp/hikaricp)
(s/def ::encryption-key string?)
(s/def ::dropwizard-registry ::monitoring/metric-registry)
(s/def ::tenant-manager (partial instance? TenantManager))

(defmethod ig/pre-init-spec :akvo.lumen.component.tenant-manager/tenant-manager [_]
  (s/keys :req-un [::db
                   ::encryption-key
                   ::dropwizard-registry]))

(defmethod ig/init-key :akvo.lumen.component.tenant-manager/wrap-label-tenant  [_ opts]
  wrap-label-tenant)

(defmethod ig/pre-init-spec :akvo.lumen.component.tenant-manager/wrap-label-tenant [_]
  empty?)
