(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.postgres.filter :as filter]
            [akvo.lumen.lib.dataset.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name column-name filter-sql]
  (rest (jdbc/query tenant-conn
                    [(format "SELECT %1$s, count(*) FROM %2$s WHERE %3$s GROUP BY %1$s"
                             column-name table-name filter-sql)]
                    {:as-arrays? true})))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (filter/sql-str columns (get query "filters"))
        bucket-column (utils/find-column columns (get query "bucketColumn"))
        bucket-column-name (get bucket-column "columnName")
        bucket-column-title (get bucket-column "title")
        bucket-column-type (get bucket-column "type")
        counts (run-query tenant-conn table-name bucket-column-name filter-sql)
        max-segments 50]
    (if (> (count counts) max-segments)
      (lib/bad-request
       {"error" true
        "reason" "too-many"
        "max" max-segments
        "count" (count counts)})
      (lib/ok
       {"series" [{"key" bucket-column-title
                   "label" bucket-column-title
                   "data" (mapv
                           (fn [[bucket-value bucket-count]]
                             {"value" bucket-count})
                           counts)}]
        "common" {"data" (mapv
                          (fn [[bucket-value bucket-count]]
                            {"key" bucket-value
                             "label" bucket-value})
                          counts)
                  "metadata" {"type" bucket-column-type}}}))))
