(ns akvo.lumen.lib.aggregation.bubble
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :as utils]
            [clojure.walk :refer (keywordize-keys)]
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
        column-size (keywordize-keys (utils/find-column columns (get query "metricColumn")))
        column-label (keywordize-keys (utils/find-column columns (get query "datapointLabelColumn")))
        column-bucket (keywordize-keys (utils/find-column columns (get query "bucketColumn")))
        max-points 2500
        have-aggregation? (boolean column-bucket)
        aggregation-method (if column-size
                             (get query "metricAggregation")
                             "count")
        sql-text-with-aggregation (str "SELECT "
                                       (sql-aggregation-subquery aggregation-method "%1$s" (or (:type column-size) (:type column-bucket)))
                                       " AS size, "
                                       "%7$s AS label FROM (SELECT * FROM %2$s WHERE %3$s ORDER BY random() LIMIT %5$s)z GROUP BY %7$s")
        sql-text-without-aggregation "
        SELECT * FROM (SELECT * FROM (SELECT %1$s AS size, %6$s AS label FROM %2$s WHERE %3$s)z ORDER BY random() LIMIT %5$s)zz ORDER BY zz.x"
        sql-text (if have-aggregation? sql-text-with-aggregation sql-text-without-aggregation)
      sql-response (run-query tenant-conn table-name sql-text (or (:columnName column-size) (get column-bucket "columnName")) filter-sql aggregation-method max-points (:columnName column-label) (:columnName column-bucket))]
    (lib/ok
     {"series" [{"key" (:title column-size)
                 "label" (:title column-size)
                 "data" (mapv (fn [[size-value label]] {"value" size-value}) sql-response)
                 "metadata"  {"type" (:type column-size)}}]
      "common" {"metadata" {"type" (:type column-label) "sampled" (= (count sql-response) max-points)}
                "data" (mapv (fn [[size-value label]] {"label" label}) sql-response)}})))
