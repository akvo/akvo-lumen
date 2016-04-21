(ns org.akvo.dash.component.tenant-manager
  "Component that controll the tenants,
  We use the first domain label e.g. t1 in t1.dash.akvo.org to dispatch."
  (:require [clojure.string :as str]
            [com.stuartsierra.component :as component]
            [hugsql.core :as hugsql])
  (:import [com.zaxxer.hikari HikariConfig HikariDataSource]))

(hugsql/def-db-fns "org/akvo/dash/component/tenant_manager.sql")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Middleware
;;;

(defn wrap-label-tenant
  "Parses the first dns label as tenant id and adds it to the request map as
  tenant-id."
  [handler]
  (fn [req]
    (handler (assoc req
                    :tenant
                    (first (str/split (get-in req [:headers "host"])
                                      #"\."))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Component
;;;

(defprotocol TenantConnection
  (connection [component label] "Connection based on a tenant dns label."))


(defn pool
  "Created a Hikari connection pool."
  [tenant]
  (let [cfg (HikariConfig.)]
    (.setJdbcUrl cfg (:db_uri tenant))
    (.setPoolName cfg (:label tenant))
    (.setMaximumPoolSize cfg 2)
    {:datasource (HikariDataSource. cfg)}))


(defrecord TenantManager [db]

  component/Lifecycle
  (start [component]
    (if (:tenants component)
      component
      (assoc component :tenants (atom {}))))

  (stop [component]
    (if-let [tenants @(:tenants component)]
      (do
        (doseq [[_ {{conn :datasource} :spec}] tenants]
          (.close ^HikariDataSource conn))
        (dissoc component :tenants))
      component))

  TenantConnection
  (connection
      [{:keys [tenants] :as component} label]
    (if-let [tenant (get @tenants label)]
      (:spec tenant)
      (do
        (if-let [tenant (tenant-by-id (:spec (:db component))
                                      {:label label})]
          (do
            (swap! tenants
                   assoc
                   label
                   {:uri  (:db_uri tenant)
                    :spec (pool tenant)})
            (:spec (get @tenants label)))
          (throw (Exception. "Could not match dns label with tenant.")))))))


(defn manager
  ""
  []
  (map->TenantManager {}))

(alter-meta! #'->TenantManager assoc :no-doc true)
(alter-meta! #'map->TenantManager assoc :no-doc true)
