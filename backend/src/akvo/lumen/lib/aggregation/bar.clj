(ns akvo.lumen.lib.aggregation.bar
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method max-points column-subbucket-name]
  (rest (jdbc/query tenant-conn
                    [(format sql-text
                             column-x-name column-y-name table-name filter-sql aggregation-method max-points column-subbucket-name)]
                    {:as-arrays? true})))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (filter/sql-str columns (get query "filters"))
        column-x (utils/find-column columns (get query "bucketColumn"))
        column-x-type (get column-x "type")
        column-x-name (get column-x "columnName")
        column-x-title (get column-x "title")
        column-y (utils/find-column columns (get query "metricColumnY"))
        column-y-name (get column-y "columnName")
        column-y-title (get column-y "title")

        column-subbucket (utils/find-column columns (get query "subBucketColumn"))
        column-subbucket-name (get column-subbucket "columnName")
        column-subbucket-title (get column-subbucket "title")

        aggregation-method (get query "metricAggregation")
        max-buckets (or (get query "truncateSize") 200)
        sql-sort-subquery (case (get query "sort")
                            nil "ORDER BY x ASC"
                            "asc" "ORDER BY z.y ASC NULLS FIRST"
                            "dsc" "ORDER BY z.y DESC NULLS LAST")
        sql-sort-subbucket-subquery (case (get query "sort")
                                      nil "ORDER BY x ASC"
                                      "asc" "ORDER BY sort_value ASC NULLS FIRST"
                                      "dsc" "ORDER BY sort_value DESC NULLS LAST")
        sql-aggregation-subquery (case aggregation-method
                                   nil ""
                                   ("min" "max" "count" "sum") (str aggregation-method  "(%2$s)")
                                   "mean" "avg(%2$s)"
                                   "median" "percentile_cont(0.5) WITHIN GROUP (ORDER BY %2$s)"
                                   "distinct" "COUNT(DISTINCT %2$s)"
                                   "q1" "percentile_cont(0.25) WITHIN GROUP (ORDER BY %2$s)"
                                   "q3" "percentile_cont(0.75) WITHIN GROUP (ORDER BY %2$s)")
        sql-text-without-subbucket (str "SELECT * FROM (SELECT %1$s as x, " sql-aggregation-subquery " as y FROM %3$s WHERE %4$s GROUP BY %1$s)z " sql-sort-subquery " LIMIT %6$s")

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

        sql-text (if column-subbucket sql-text-with-subbucket sql-text-without-subbucket)
        sql-response (run-query tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method max-buckets column-subbucket-name)
        bucket-values (distinct
                       (mapv
                        (fn [[x-value y-value s-value]] x-value)
                        sql-response))
        subbucket-values (distinct
                          (mapv
                           (fn [[x-value y-value s-value]] s-value)
                           sql-response))]
    (lib/ok
     (if (not column-subbucket)
       {"series" [{"key" column-y-title
                   "label" column-y-title
                   "data" (mapv (fn [[x-value y-value]]
                                  {"value" y-value})
                                sql-response)}]
        "common" {"metadata" {"type" column-x-type}
                  "data" (mapv (fn [[x-value y-value]]
                                 {"label" x-value "key" x-value})
                               sql-response)}}
       {"series"
        (mapv
         (fn [s-value]
           {"key" s-value
            "label" s-value
            "data"
            (map
             (fn
               [bucket-value]
               {"value"
                (or (nth
                     (first
                      (filter
                       (fn [o] (and (= (nth o 0) bucket-value) (= (nth o 2) s-value)))
                       sql-response))
                     1
                     0) 0)})
             bucket-values)})
         subbucket-values)

        "common"
        {"metadata"
         {"type" column-x-type}
         "data"  (mapv
                  (fn [bucket] {"label" bucket "key" bucket})
                  bucket-values)}}))))
