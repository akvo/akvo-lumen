(ns akvo.lumen.admin.stats.run-query
  (:require [akvo.lumen.admin.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.string :as s]))

;; Same env vars as the rest of admin scripts

;; Run query for comma separated list of tenant-labels
;; Run query for comma separated list of tenant-labels
#_(defn -main [tenant-labels query]
    (let [tenant-labels (s/split tenant-labels #",")
          uris (->> ["SELECT label as \"tenant-label\", db_uri as \"db-uri\" FROM tenants"]
                    (jdbc/query (util/db-uri {:database "lumen"}))
                    (filter #((set tenant-labels) (:tenant-label %))))]
      (json/generate-stream
       (for [{:keys [db-uri tenant-label]} uris]
         (jdbc/with-db-transaction [conn db-uri {:read-only? true}]
           [tenant-label (jdbc/query conn [query])]))
       *out*)))

(defn number-of-datasets [uris date]
  (let [query (format "SELECT COUNT(id) FROM history.data_source WHERE lower(_validrange) < '%s'::DATE AT TIME ZONE 'UTC';" date)
        r (for [{:keys [db-uri tenant-label]} uris]
            (jdbc/with-db-transaction [conn db-uri {:read-only? true}]
              (jdbc/query conn [query])))]
    {:number-of-datasets (reduce (fn [n v]
                                   (+ n (-> v first :count)))
                                 0 r)}))

(defn number-of-dashboards [uris date]
  (let [query (format "SELECT COUNT(id) FROM history.dashboard WHERE lower(_validrange) < '%s'::DATE AT TIME ZONE 'UTC';" date)
        r (for [{:keys [db-uri tenant-label]} uris]
            (jdbc/with-db-transaction [conn db-uri {:read-only? true}]
              (jdbc/query conn [query])))]
    {:number-of-dashboards (reduce (fn [n v]
                                     (+ n (-> v first :count)))
                                   0 r)}))

(defn fetch-uris [tenant-labels]
  (->> ["SELECT label as \"tenant-label\", db_uri as \"db-uri\" FROM tenants"]
       (jdbc/query (util/db-uri {:database "lumen"}))
       (filter #((set tenant-labels) (:tenant-label %)))))

(defn -main
  ([tenant-labels]
   (-main tenant-labels
          (.format (java.text.SimpleDateFormat. "yyyy-MM-dd") (new java.util.Date))))
  ([tenant-labels date]
   (let [tenant-labels (s/split tenant-labels #",")
         uris (fetch-uris tenant-labels)]
     (prn
      (merge {:at-date date}
             (number-of-datasets uris date)
             (number-of-dashboards uris date))))))
