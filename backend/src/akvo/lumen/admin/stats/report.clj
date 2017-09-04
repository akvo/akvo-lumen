(ns akvo.lumen.admin.stats.report
  "Same env vars as the rest of admin scripts
  report
  report \"2017-04-01\"
  report \"now\" \"t1\"
  report \"2017-04-01\" \"t1,t2\"
  "
  (:require [akvo.lumen.admin.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.string :as s]))

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

(defn fetch-uris
  ([date]
   (fetch-uris date (constantly true)))
  ([date filter-fn]
   (->> (format "SELECT DISTINCT ON (label) label as \"tenant-label\", db_uri as \"db-uri\", _validrange FROM history.tenants WHERE lower(_validrange) < '%s'::DATE AT TIME ZONE 'UTC' ORDER BY label, _validrange DESC;" date)
        (jdbc/query (util/db-uri {:database "lumen"}))
        (filter filter-fn))))

(defn stats [date filter-fn]
  (let [date (if (= date "now")
               (.format (java.text.SimpleDateFormat. "yyyy-MM-dd") (new java.util.Date))
               date)
        uris (fetch-uris date filter-fn)]
    (merge {:at-date date}
           {:number-of-tenants (count uris)}
           (number-of-datasets uris date)
           (number-of-dashboards uris date))))

(defn -main
  ([]
   (-main "now"))
  ([date]
   (let [filter-fn (constantly true)]
     (prn (stats date filter-fn))))
  ([date tenant-labels]
   (let [filter-fn (fn [{:keys [tenant-label]}]
                     (contains? (set (s/split tenant-labels #","))
                                tenant-label))]
     (prn (stats date filter-fn)))))
