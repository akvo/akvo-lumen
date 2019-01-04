(ns akvo.lumen.lib.aggregation.bubble
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils-kw :refer (find-column)]
            [akvo.lumen.postgres.filter-kw :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys)]))

(defn- run-query [tenant-conn table-name sql-text column-size-name filter-sql aggregation-method max-points column-bucket-name]
  (let [sql-query (format sql-text column-size-name table-name filter-sql aggregation-method max-points column-bucket-name)]
    (log/debug :sql-query sql-query)
    (rest (jdbc/query tenant-conn [sql-query] {:as-arrays? true}))))

(defn cast-to-decimal [column-string column-type]
  (case column-type
    "number" column-string
    "date" (str "(1000 * cast(extract(epoch from " column-string ") as decimal))")
    column-string))

(defn sql-aggregation-subquery [aggregation-method column-string column-type]
  (case aggregation-method
    nil ""
    ("min" "max" "sum") (str aggregation-method "(" (cast-to-decimal column-string column-type) "::decimal)")
    "count" (str aggregation-method "(" column-string (if (#{"number" "data"} column-type) "::decimal" "::text") ")")
    "mean" (str "avg(" (cast-to-decimal column-string column-type) "::decimal)")
    "median" (str "percentile_cont(0.5) WITHIN GROUP (ORDER BY " (cast-to-decimal column-string column-type) ")")
    "distinct" (str "COUNT(DISTINCT " (cast-to-decimal column-string column-type) ")")
    "q1" (str "percentile_cont(0.25) WITHIN GROUP (ORDER BY " (cast-to-decimal column-string column-type) ")")
    "q3" (str "percentile_cont(0.75) WITHIN GROUP (ORDER BY " (cast-to-decimal column-string column-type) ")")))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [columns (keywordize-keys columns)
        query (keywordize-keys query)
        filter-sql (sql-str columns (:filters query))
        column-size  (find-column columns (:metricColumn query))
        column-bucket (find-column columns (:bucketColumn query))
        max-points 2500
        aggregation-method (if column-size (:metricAggregation query) "count")
        sql-text (str "SELECT "
                      (sql-aggregation-subquery aggregation-method "%1$s" (or (:type column-size) (:type column-bucket)))
                      " AS size, "
                      "%6$s AS label FROM (SELECT * FROM %2$s WHERE %3$s ORDER BY random() LIMIT %5$s)z GROUP BY %6$s")
        sql-response (run-query tenant-conn table-name
                                sql-text
                                (or (:columnName column-size) (:columnName column-bucket))
                                filter-sql
                                aggregation-method
                                max-points
                                (:columnName column-bucket))]
    (lib/ok
     {:series [{:key      (:title column-size)
                :label    (:title column-size)
                :data     (mapv (fn [[size-value label]] {:value size-value}) sql-response)
                :metadata {:type (:type column-size)}}]
      :common {:metadata {:sampled (= (count sql-response) max-points)}
               :data     (mapv (fn [[size-value label]] {:label label}) sql-response)}})))
