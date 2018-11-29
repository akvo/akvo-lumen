(ns akvo.lumen.lib.aggregation.bubble
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :as utils]
            [akvo.lumen.postgres.filter :as filter]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-size-name filter-sql aggregation-method max-points column-label-name column-bucket-name]
  (rest (jdbc/query tenant-conn
                    [(format sql-text
                             column-size-name table-name filter-sql aggregation-method max-points column-label-name column-bucket-name)]
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
  (let [filter-sql (filter/sql-str columns (get query "filters"))
        column-size (utils/find-column columns (get query "metricColumn"))
        column-size-type (get column-size "type")
        column-size-name (get column-size "columnName")
        column-size-title (get column-size "title")
        column-label (utils/find-column columns (get query "datapointLabelColumn"))
        column-label-type (get column-label "type")
        column-label-name (get column-label "columnName")
        column-label-title (get column-label "title")
        column-bucket (utils/find-column columns (get query "bucketColumn"))
        column-bucket-name (get column-bucket "columnName")
        column-bucket-title (get column-bucket "title")
        max-points 2500
        have-aggregation (boolean column-bucket)
        aggregation-method (get query "metricAggregation")

        sql-text-with-aggregation (str "SELECT "
                                       (sql-aggregation-subquery aggregation-method "%1$s" column-size-type)
                                       " AS size, "
                                       "%7$s AS label FROM (SELECT * FROM %2$s WHERE %3$s ORDER BY random() LIMIT %5$s)z GROUP BY %7$s")
        sql-text-without-aggregation "
        SELECT * FROM (SELECT * FROM (SELECT %1$s AS size, %6$s AS label FROM %2$s WHERE %3$s)z ORDER BY random() LIMIT %5$s)zz ORDER BY zz.x"
        sql-text (if have-aggregation sql-text-with-aggregation sql-text-without-aggregation)
        sql-response (run-query tenant-conn table-name sql-text column-size-name filter-sql aggregation-method max-points column-label-name column-bucket-name)]
    (lib/ok
     {"series" [{"key" column-size-title
                 "label" column-size-title
                 "data" (mapv (fn [[size-value label]] {"value" size-value}) sql-response)
                 "metadata"  {"type" column-size-type}}]
      "common" {"metadata" {"type" column-label-type "sampled" (= (count sql-response) max-points)}
                "data" (mapv (fn [[size-value label]] {"label" label}) sql-response)}})))
