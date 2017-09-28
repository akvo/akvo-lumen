(ns akvo.lumen.component.tenant-manager
  "Component that controll the tenants,
  We use the first domain label e.g. t1 in t1.lumen.akvo.org to dispatch."
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aes :as aes]
            [clojure.string :as str]
            [com.stuartsierra.component :as component]
            [hugsql.core :as hugsql])
  (:import [com.zaxxer.hikari HikariConfig HikariDataSource]))

(hugsql/def-db-fns "akvo/lumen/component/tenant_manager.sql")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Middleware
;;;

(defn subdomain? [host]
  (>= (get (frequencies host) \.) 2))

(defn healthz? [{:keys [request-method path-info]}]
  (and (= request-method :get)
       (= path-info "/healthz")))

(defn wrap-label-tenant
  "Parses the first dns label as tenant id and adds it to the request map as
  tenant-id."
  [handler]
  (fn [req]
    (let [host (get-in req [:headers "host"])]
      (cond
        (healthz? req) (handler req)
        (subdomain? host) (handler (assoc req :tenant (first (str/split host #"\."))))
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
  [tenant]
  (let [cfg (HikariConfig.)]
    (.setJdbcUrl cfg (:db_uri tenant))
    (.setPoolName cfg (:label tenant))
    (.setMaximumPoolSize cfg 2)
    {:datasource (HikariDataSource. cfg)}))


(defn load-tenant [db encryption-key tenants label]
  (if-let [{:keys [db_uri label]} (tenant-by-id (:spec db)
                                                {:label label})]
    (let [decrypted-db-uri (aes/decrypt encryption-key db_uri)]
      (swap! tenants
             assoc
             label
             {:uri decrypted-db-uri
              :spec (pool {:db_uri decrypted-db-uri
                           :label label})}))
    (throw (Exception. "Could not match dns label with tenant from tenats."))))


(defrecord TenantManager [db config]

  component/Lifecycle
  (start [this]
    (if (:tenants this)
      this
      (assoc this :tenants (atom {}))))

  (stop [this]
    (if-let [tenants (:tenants this)]
      (do
        (doseq [[_ {{^HikariDataSource conn :datasource} :spec}] @tenants]
          (.close conn))
        (dissoc this :tenants))
      this))

  TenantConnection
  (connection [{:keys [tenants]} label]
    (if-let [tenant (get @tenants label)]
      (:spec tenant)
      (do
        (load-tenant db (:encryption-key config) tenants label)
        (:spec (get @tenants label)))))

  (uri [{:keys [db tenants]} label]
    (if-let [tenant (get @tenants label)]
      (:uri tenant)
      (do
        (load-tenant db (:encryption-key config) tenants label)
        (:uri (get @tenants label)))))

  TenantAdmin
  (current-plan [{:keys [db]} label]
    (:tier (select-current-plan (:spec db) {:label label}))))

(defn tenant-manager [options]
  (map->TenantManager options))
