(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.http :as http]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn run-query [tenant-conn table-name column-name filter-sql]
  (rest (jdbc/query tenant-conn
                    [(format "SELECT %s, count(*) FROM %s WHERE %s GROUP BY %s"
                             column-name table-name filter-sql column-name)]
                    {:as-arrays? true})) )

(defn query [tenant-conn dataset query]
  (let [columns (:columns dataset)
        filter-sql (filter/sql-str (:columns dataset) (get query "filters"))
        bucket-column (utils/find-column columns (get query "bucketColumn"))
        bucket-column-name (get bucket-column "columnName")
        bucket-column-title (get bucket-column "title")
        table-name (:table-name dataset)
        counts (run-query tenant-conn table-name bucket-column-name filter-sql)]
    (http/ok {"metadata" {"bucketColumnTitle" bucket-column-title}
              "data" (mapv (fn [[bucket-value bucket-count]]
                             {"bucketValue" bucket-value
                              "bucketCount" bucket-count})
                           counts)})) )
