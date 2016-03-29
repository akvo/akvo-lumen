(ns org.akvo.dash.component.tenants
  "Component that controll the tenants, hence - \"lord\"
  We use the first domain label e.g. t1 in t1.dash.akvo.org to dispatch."
  (:require
   [clojure.pprint :refer [pprint]]
   [clojure.string :as str]
   [com.stuartsierra.component :as component]
   [hugsql.core :as hugsql])
  (:import [com.zaxxer.hikari HikariConfig HikariDataSource]))


(hugsql/def-db-fns "org/akvo/dash/component/tenants.sql")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Middleware
;;;

(defn wrap-label-tenant
  "Parses the first dns label as tenant id and adds it to the request map as
  tenant-id."
  {:arglist '([handler])}
  [handler]
  (fn [req]
    (handler (assoc req
                    :tenant-label
                    (first (str/split (get-in req [:headers "host"])
                                      #"\."))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Component
;;;

(defprotocol TenantConnection
  (connection [component tenant-id] "Geta connection based on a tenant-id"))


(defn- connection-pool
  "Creates a Hikari connection pool, using an tenant instance. Maybe this needs
  some typing to not break with changes..."
  [tenant]
  (let [cfg (HikariConfig.)]
    (.setJdbcUrl cfg
                 (get tenant :db_url))
    (.setDataSourceClassName cfg
                             "org.postgresql.ds.PGSimpleDataSource")
    (.setMaximumPoolSize cfg 2)
    {:datasource (HikariDataSource. cfg)}))

(defrecord Lord [db]

  component/Lifecycle
  (start [component]
    (assoc component :tenants (atom {})))

  (stop [component]
    (doseq [[_ conn] (deref (:tenants component))]
      (.close (:datasource conn)))
    (dissoc component :tenants))

  TenantConnection
  (connection [{:keys [db tenants]} label]
    (if-let [tenant (get @tenants label)]
      tenant
      (do ;; setup tenant connection pool from db values
        (if-let [tenant (tenant-by-id (:spec db)
                                      {:label label})]
          (do
            (swap! tenants
                   assoc
                   label
                   (connection-pool tenant))
            (get @tenants label))
          (throw (Exception. "Could not match dns label with tenant.")))))))


(defn lord
  ""
  []
  (map->Lord {}))

(alter-meta! #'->Lord assoc :no-doc true)
(alter-meta! #'map->Lord assoc :no-doc true)
