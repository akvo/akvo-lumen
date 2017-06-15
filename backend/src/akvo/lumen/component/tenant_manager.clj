(ns akvo.lumen.component.tenant-manager
  "Component that controll the tenants,
  We use the first domain label e.g. t1 in t1.lumen.akvo.org to dispatch."
  (:require [akvo.lumen.lib :as lib]
            [clojure.string :as str]
            [com.stuartsierra.component :as component]
            [hugsql.core :as hugsql]
            [ragtime
             [jdbc :as ragtime-jdbc]
             [repl :as ragtime-repl]])
  (:import [com.zaxxer.hikari HikariConfig HikariDataSource]))

(hugsql/def-db-fns "akvo/lumen/component/tenant_manager.sql")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Middleware
;;;

(defn subdomain? [host]
  (>= (get (frequencies host) \.) 2))

(defn wrap-label-tenant
  "Parses the first dns label as tenant id and adds it to the request map as
  tenant-id."
  [handler]
  (fn [req]
    (let [host (get-in req [:headers "host"])]
      (if (subdomain? host)
        (handler (assoc req :tenant (first (str/split host #"\."))))

        (lib/bad-request "Not a tenant")))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Component
;;;

(defprotocol TenantConnection
  (connection [this label] "Connection based on a tenant dns label.")
  (uri [this label] "Database URI based on a tenant dns label."))


(defn pool
  "Created a Hikari connection pool."
  [tenant]
  (let [cfg (HikariConfig.)]
    (.setJdbcUrl cfg (:db_uri tenant))
    (.setPoolName cfg (:label tenant))
    (.setMaximumPoolSize cfg 2)
    {:datasource (HikariDataSource. cfg)}))


(defn load-tenant [db tenants label]
  (if-let [tenant (tenant-by-id (:spec db)
                                {:label label})]
    (swap! tenants
           assoc
           label
           {:uri  (:db_uri tenant)
            :spec (pool tenant)})
    (throw (Exception. "Could not match dns label with tenant from tenats."))))


(defrecord TenantManager [db]

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
  (connection [{:keys [db tenants]} label]
    (if-let [tenant (get @tenants label)]
      (:spec tenant)
      (do
        (load-tenant db tenants label)
        (:spec (get @tenants label)))))

  (uri [{:keys [db tenants]} label]
    (if-let [tenant (get @tenants label)]
      (:uri tenant)
      (do
        (load-tenant db tenants label)
        (:uri (get @tenants label))))))


(defn tenant-manager [options]
  (map->TenantManager options))
