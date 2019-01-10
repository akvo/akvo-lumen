(ns akvo.lumen.lib.aggregation.bar
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text bucket-column-name metric-y-column-name filter-sql aggregation-method truncate-size subbucket-column-name]
  (let [q (format sql-text bucket-column-name metric-y-column-name table-name filter-sql aggregation-method truncate-size subbucket-column-name)]
    (rest (jdbc/query tenant-conn
                     [q]
                     {:as-arrays? true}))))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql                  (sql-str columns (:filters query))
        max-elements                200
        bucket-column               (find-column columns (:bucketColumn query))
        subbucket-column            (find-column columns (:subBucketColumn query))
        metric-y-column             (or (find-column columns (:metricColumnY query)) subbucket-column)
        aggregation-method          (if-not metric-y-column "count" (:metricAggregation query))
        truncate-size               (or (:truncateSize query) "ALL")
        sql-sort-subbucket-subquery (case (:sort query)
                                      nil   "ORDER BY x ASC"
                                      "asc" "ORDER BY sort_value ASC NULLS FIRST"
                                      "dsc" "ORDER BY sort_value DESC NULLS LAST")
        sql-aggregation-subquery    (case aggregation-method
                                      nil                         "NULL"
                                      ("min" "max" "count" "sum") (str aggregation-method  "(%2$s)")
                                      "mean"                      "avg(%2$s)"
                                      "median"                    "percentile_cont(0.5) WITHIN GROUP (ORDER BY %2$s)"
                                      "distinct"                  "COUNT(DISTINCT %2$s)"
                                      "q1"                        "percentile_cont(0.25) WITHIN GROUP (ORDER BY %2$s)"
                                      "q3"                        "percentile_cont(0.75) WITHIN GROUP (ORDER BY %2$s)")
        sql-text-without-subbucket  (str "SELECT * FROM (SELECT %1$s as x, " sql-aggregation-subquery " as y FROM %3$s WHERE %4$s GROUP BY %1$s)z " (case (:sort query)
                                      nil   "ORDER BY x ASC"
                                      "asc" "ORDER BY z.y ASC NULLS FIRST"
                                      "dsc" "ORDER BY z.y DESC NULLS LAST") " LIMIT %6$s")

        sql-text-with-subbucket (str "
          WITH
            sort_table
          AS
            (SELECT %1$s AS x, " sql-aggregation-subquery " AS sort_value, TRUE as include_value FROM %3$s WHERE %4$s GROUP BY %1$s " sql-sort-subbucket-subquery " LIMIT %6$s)
          ,
            data_table
          AS
            ( SELECT %1$s as x, " sql-aggregation-subquery " as y,
              %7$s as s
              FROM %3$s
              WHERE %4$s
              GROUP BY %1$s, %7$s
            )
          SELECT
            data_table.x AS x,
            data_table.y,
            data_table.s,
            sort_table.sort_value,
            sort_table.include_value
          FROM
            data_table
          LEFT JOIN
            sort_table
          ON
            COALESCE(sort_table.x::text, '@@@MISSINGDATA@@@') = COALESCE(data_table.x::text, '@@@MISSINGDATA@@@')
          WHERE
            sort_table.include_value IS NOT NULL
          " sql-sort-subbucket-subquery)
        sql-text         (if bucket-column
                           (if subbucket-column
                             sql-text-with-subbucket
                             sql-text-without-subbucket)
                           "SELECT NULL")
        sql-response     (run-query tenant-conn table-name sql-text
                                    (:columnName bucket-column)
                                    (or (:columnName metric-y-column)
                                        (:columnName bucket-column))
                                    filter-sql aggregation-method truncate-size (:columnName subbucket-column))
        bucket-values    (distinct
                          (mapv
                           (fn [[x-value y-value s-value]] x-value)
                           sql-response))
        subbucket-values (distinct
                          (mapv
                           (fn [[x-value y-value s-value]] s-value)
                           sql-response))]
    (if (> (count sql-response) max-elements)
      (lib/bad-request
       {"error"  true
        "reason" "too-many"
        "max"    max-elements
        "count"  (count sql-response)})

      (lib/ok
       (if (not subbucket-column)
         {:series [{:key   (:title metric-y-column)
                    :label (:title metric-y-column)
                    :data  (mapv (fn [[x-value y-value]]
                                   {:value y-value})
                                 sql-response)}]
          :common {:metadata {:type (:type bucket-column)}
                   :data     (mapv (fn [[x-value y-value]]
                                     {:label x-value
                                      :key   x-value})
                                   sql-response)}}
         {:series
          (mapv
           (fn [s-value]
             {:key   s-value
              :label s-value
              :data
              (map
               (fn
                 [bucket-value]
                 {:value
                  (or (nth
                       (first
                        (filter
                         (fn [o] (and (= (nth o 0) bucket-value) (= (nth o 2) s-value)))
                         sql-response))
                       1
                       0) 0)})
               bucket-values)})
           subbucket-values)

          :common
          {:metadata
           {:type (:type bucket-column)}
           :data (mapv
                  (fn [bucket] {:label bucket
                                :key   bucket})
                  bucket-values)}})))))
