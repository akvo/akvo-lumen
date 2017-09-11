(ns akvo.lumen.admin.stats.report
  "The following env vars are assumed to be present:
  PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  The PG_* env vars can be found in the ElephantSQL console for the appropriate
  instance.
  Use this as follow
  $ env PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.stats.report
  Script can be executed with optional arguments
  lein run -m akvo.lumen.admin.stats.report \"2017-09-01\"
  or
  lein run -m akvo.lumen.admin.stats.report now \"t1,t2\""
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
