(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.http :as http]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name column-name filter-sql]
  (rest (jdbc/query tenant-conn
                    [(format "SELECT %1$s, count(*) FROM %2$s WHERE %3$s GROUP BY %1$s"
                             column-name table-name filter-sql)]
                    {:as-arrays? true})) )

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (filter/sql-str columns (get query "filters"))
        bucket-column (utils/find-column columns (get query "bucketColumn"))
        bucket-column-name (get bucket-column "columnName")
        bucket-column-title (get bucket-column "title")
        counts (run-query tenant-conn table-name bucket-column-name filter-sql)]
    (http/ok {"metadata" {"bucketColumnTitle" bucket-column-title}
              "data" (mapv (fn [[bucket-value bucket-count]]
                             {"bucketValue" bucket-value
                              "bucketCount" bucket-count})
                           counts)})))
