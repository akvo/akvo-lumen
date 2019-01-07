(ns akvo.lumen.lib.aggregation.bar
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [clojure.walk :refer (keywordize-keys stringify-keys)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method truncate-size column-subbucket-name]
  (rest (jdbc/query tenant-conn
                    [(format sql-text
                             column-x-name column-y-name table-name filter-sql aggregation-method truncate-size column-subbucket-name)]
                    {:as-arrays? true})))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [columns (keywordize-keys columns)
        query   (keywordize-keys query)

        filter-sql                  (sql-str columns (:filters query))
        max-elements                200
        column-x                    (find-column columns (:bucketColumn query))
        column-subbucket            (find-column columns (:subBucketColumn query))
        column-y                    (or (find-column columns (:metricColumnY query)) column-subbucket)
        aggregation-method          (if (and (not column-y) column-x) "count" (:metricAggregation query))
        truncate-size               (or (:truncateSize query) "ALL")
        sql-sort-subquery           (case (:sort query)
                                      nil   "ORDER BY x ASC"
                                      "asc" "ORDER BY z.y ASC NULLS FIRST"
                                      "dsc" "ORDER BY z.y DESC NULLS LAST")
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
        sql-text-without-subbucket  (str "SELECT * FROM (SELECT %1$s as x, " sql-aggregation-subquery " as y FROM %3$s WHERE %4$s GROUP BY %1$s)z " sql-sort-subquery " LIMIT %6$s")

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

        valid-spec       (boolean column-x)
        sql-text         (if valid-spec
                           (if column-subbucket
                             sql-text-with-subbucket
                             sql-text-without-subbucket)
                           "SELECT NULL")
        sql-response     (run-query tenant-conn table-name sql-text
                                    (:columnName column-x)
                                    (or (:columnName column-y)
                                        (:columnName column-x))
                                    filter-sql aggregation-method truncate-size (:columnName column-subbucket))
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
       (if (not column-subbucket)
         {:series [{:key   (:title column-y)
                    :label (:title column-y)
                    :data  (mapv (fn [[x-value y-value]]
                                   {:value y-value})
                                 sql-response)}]
          :common {:metadata {:type (:type column-x)}
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
           {:type (:type column-x)}
           :data (mapv
                  (fn [bucket] {:label bucket
                                :key   bucket})
                  bucket-values)}})))))
