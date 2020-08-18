(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.commons :refer (run-query sql-option-bucket-column) :as commons]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql    (sql-str columns (:filters query))
        bucket-column (find-column columns (:bucketColumn query))
        query         (format "SELECT %1$s, count(*) FROM %2$s WHERE %3$s GROUP BY %1$s"
                              (sql-option-bucket-column bucket-column) table-name filter-sql)
        counts        (run-query tenant-conn query)
        max-segments  50]
    (if (> (count counts) max-segments)
      (lib/bad-request
       {:error  true
        :reason "too-many"
        :max    max-segments
        :count  (count counts)})
      (lib/ok
       {:series [{:key   (:title bucket-column)
                  :label (:title bucket-column)
                  :data  (mapv
                          (fn [[bucket-value bucket-count]]
                            {:value bucket-count})
                          counts)}]
        :common {:data     (mapv
                            (fn [[bucket-value bucket-count]]
                              {:key   bucket-value
                               :label bucket-value})
                            counts)
                 :metadata {:type (:type bucket-column)}}}))))
