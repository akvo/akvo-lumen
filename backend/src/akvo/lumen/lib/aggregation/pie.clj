(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name column-name filter-sql]
  (rest (jdbc/query tenant-conn
                    [(format "SELECT %1$s, count(*) FROM %2$s WHERE %3$s GROUP BY %1$s"
                             column-name table-name filter-sql)]
                    {:as-arrays? true})))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (sql-str columns (:filters query))
        bucket-column (find-column columns (:bucketColumn query))
        counts (run-query tenant-conn table-name (:columnName bucket-column) filter-sql)
        max-segments 50]
    (if (> (count counts) max-segments)
      (lib/bad-request
       {:error true
        :reason "too-many"
        :max max-segments
        :count (count counts)})
      (lib/ok
       {:series [{:key (:title bucket-column)
                  :label (:title bucket-column)
                  :data (mapv
                           (fn [[bucket-value bucket-count]]
                             {:value bucket-count})
                           counts)}]
        :common {:data (mapv
                          (fn [[bucket-value bucket-count]]
                            {:key bucket-value
                             :label bucket-value})
                          counts)
                  :metadata {:type (:type bucket-column)}}}))))
