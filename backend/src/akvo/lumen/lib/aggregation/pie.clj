(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.http :as http]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn non-null-query [tenant-conn table-name column-name filter-sql]
  (rest (jdbc/query tenant-conn
                    [(format "SELECT %s, count(*) FROM %s WHERE %s GROUP BY %s"
                             column-name table-name filter-sql column-name)]
                    {:as-arrays? true})) )

(defn null-query [tenant-conn table-name column-name filter-sql]
  (let [n (ffirst (rest (jdbc/query tenant-conn
                                    [(format "SELECT count(*) FROM %s WHERE %s IS NULL AND %s"
                                             table-name column-name filter-sql)]
                                    {:as-arrays? true})) )]
    (when-not (zero? n)
      [[nil n]])))

(defn query [tenant-conn dataset query]
  (let [columns (:columns dataset)
        filter-sql (filter/sql-str (:columns dataset) (get query "filters"))
        bucket-column (utils/find-column columns (get query "bucketColumn"))
        bucket-column-name (get bucket-column "columnName")
        bucket-column-title (get bucket-column "title")
        table-name (:table-name dataset)
        non-null-counts (non-null-query tenant-conn table-name bucket-column-name filter-sql)
        null-counts (null-query tenant-conn table-name bucket-column-name filter-sql)
        counts (if null-counts
                 (concat non-null-counts null-counts)
                 non-null-counts)]
    (http/ok {"metadata" {"bucketColumnTitle" bucket-column-title}
              "data" (mapv (fn [[bucket-value bucket-count]]
                             {"bucketValue" bucket-value
                              "bucketCount" bucket-count})
                           counts)})) )
