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

(defn dashboard-response-data [tenant-conn id windshaft-url]
  (when-let [dashboard (dashboard/fetch tenant-conn id)]
    (assoc (aggregation/aggregate-dashboard-viss dashboard tenant-conn windshaft-url)
           :dashboards {id dashboard})))

(defn response-data [tenant-conn share windshaft-url]
  (if-let [dashboard-id (:dashboard-id share)]
    (assoc (dashboard-response-data tenant-conn dashboard-id windshaft-url)
           :dashboardId dashboard-id)
    (let [visualisation-id (:visualisation-id share)]
      (assoc (aggregation/visualisation-response-data tenant-conn visualisation-id windshaft-url)
             :visualisationId visualisation-id))))

(defn share
  [tenant-conn windshaft-url id password]
  (if-let [share (get-share tenant-conn id)]
    (if (:protected share)
      (if (scrypt/verify (format "%s|%s" id password) (:password share))
        (lib/ok (response-data tenant-conn share windshaft-url))
        (lib/not-authorized {"shareId" id}))
      (lib/ok (response-data tenant-conn share windshaft-url)))
    (lib/not-found {"shareId" id})))
