(ns akvo.lumen.lib.aggregation.scatter
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method max-points column-label-name column-bucket-name]
  (rest (jdbc/query tenant-conn
                    [(format sql-text
                             column-x-name column-y-name table-name filter-sql aggregation-method max-points column-label-name column-bucket-name)]
                    {:as-arrays? true})))

(defn cast-to-decimal [column-string column-type]
  (case column-type
    "number" column-string
    "date" (str "(1000 * cast(extract(epoch from " column-string ") as decimal))")
    column-string))

(defn sql-aggregation-subquery [aggregation-method column-string column-type]
  (case aggregation-method
    nil ""
    ("min" "max" "count" "sum") (str aggregation-method "(" (cast-to-decimal column-string column-type) "::decimal)")
    "mean" (str "avg(" (cast-to-decimal column-string column-type) "::decimal)")
    "median" (str "percentile_cont(0.5) WITHIN GROUP (ORDER BY " (cast-to-decimal column-string column-type) ")")
    "distinct" (str "COUNT(DISTINCT " (cast-to-decimal column-string column-type) ")")
    "q1" (str "percentile_cont(0.25) WITHIN GROUP (ORDER BY " (cast-to-decimal column-string column-type) ")")
    "q3" (str "percentile_cont(0.75) WITHIN GROUP (ORDER BY " (cast-to-decimal column-string column-type) ")")))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (filter/sql-str columns (:filters query))
        column-x (utils/find-column columns (:metricColumnX query))
        column-y (utils/find-column columns (:metricColumnY query))
        column-label (utils/find-column columns (:datapointLabelColumn query))
        column-bucket (utils/find-column columns (:bucketColumn query))
        max-points 2500
        aggregation-method (:metricAggregation query)

        sql-text-with-aggregation (str "SELECT "
                                       (sql-aggregation-subquery aggregation-method "%1$s" (:type column-x))
                                       " AS x, "
                                       (sql-aggregation-subquery aggregation-method "%2$s" (:type column-y))
                                       " AS y, %8$s AS label FROM (SELECT * FROM %3$s WHERE %4$s ORDER BY random() LIMIT %6$s)z GROUP BY %8$s")
        sql-text-without-aggregation "
          SELECT * FROM (SELECT * FROM (SELECT %1$s AS x, %2$s AS y, %7$s AS label FROM %3$s WHERE %4$s)z ORDER BY random() LIMIT %6$s)zz ORDER BY zz.x"
        sql-text (if (boolean column-bucket) sql-text-with-aggregation sql-text-without-aggregation)
        sql-response (run-query tenant-conn table-name sql-text (:columnName column-x) (:columnName column-y) filter-sql aggregation-method max-points (:columnName column-label) (:columnName column-bucket))]
    (lib/ok
     {"series" [{"key" (:title column-x)
                 "label" (:title column-x)
                 "data" (mapv (fn [[x-value y-value label]]
                                {"value" x-value})
                              sql-response)
                 "metadata" {"type" (:type column-x)}}
                {"key" (:title column-y)
                 "label" (:title column-y)
                 "data" (mapv (fn [[x-value y-value label]]
                                {"value" y-value})
                              sql-response)
                 "metadata"  {"type" (:type column-y)}}]
      "common" {"metadata" {"type" (:type column-label) "sampled" (= (count sql-response) max-points)}
                "data" (mapv (fn [[x-value y-value label]]
                               {"label" label})
                             sql-response)}})))
