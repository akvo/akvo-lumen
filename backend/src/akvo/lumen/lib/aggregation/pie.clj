(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.commons :refer (run-query sql-option-bucket-column) :as commons]
            [akvo.lumen.lib.dataset.utils :refer (find-column from-clause)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.tools.logging :as log]
            [clojure.string :as str]
            [clojure.java.jdbc :as jdbc]))

(defn query
  [tenant-conn ds-versions query]
  (let [columns   (reduce #(into % (:columns %2)) [] ds-versions)
        filter-sql    (sql-str columns (:filters query))
        bucket-column (find-column columns (:bucketColumn query))
        query         (format "SELECT %1$s as x, count(*) FROM %2$s WHERE %3$s GROUP BY x"
                              (sql-option-bucket-column bucket-column)
                              (from-clause (map :table-name ds-versions))
                              filter-sql)
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
