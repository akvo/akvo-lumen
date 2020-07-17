(ns akvo.lumen.lib.public
  (:require [akvo.lumen.db.public :as db.public]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.auth :as l.auth]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clojurewerkz.scrypt.core :as scrypt]
            [clojure.walk :as walk]
            [clojure.set :as set]))

(defn get-share [tenant-conn id]
  (db.public/public-by-id tenant-conn {:id id}))

(defn dashboard-response-data [tenant-conn id windshaft-url dashboard-filter]
  (when-let [dashboard (dashboard/fetch tenant-conn id)]
    (let [spec-filter (update (:filter dashboard) :columns (partial map #(update % :value (constantly nil))))]
      (assoc
       (aggregation/aggregate-dashboard-viss dashboard tenant-conn windshaft-url (or dashboard-filter spec-filter {}))
       :dashboards {id dashboard}))))

(defn response-data [tenant-conn share windshaft-url dashboard-filter]
  (if-let [dashboard-id (:dashboard-id share)]
    (assoc (dashboard-response-data tenant-conn dashboard-id windshaft-url dashboard-filter)
           :dashboardId dashboard-id)
    (let [visualisation-id (:visualisation-id share)]
      (assoc (aggregation/visualisation-response-data tenant-conn visualisation-id windshaft-url {} (atom 0))
             :visualisationId visualisation-id))))

(defn share* [tenant-conn id]
  (get-share tenant-conn id))

(defn auth-share* [share password]
  (if (:protected share)
    (when (scrypt/verify (format "%s|%s" (:id share) password) (:password share))
      share)
    share))

(defn share
  [tenant-conn windshaft-url id password dashboard-filter]
  (if-let [share (share* tenant-conn id)]
    (if-let [auth-share* (auth-share* share password)]
      (lib/ok (response-data tenant-conn auth-share* windshaft-url dashboard-filter))
      (lib/not-authorized {"shareId" id}))
    (lib/not-found {"shareId" id})))
