(ns akvo.lumen.lib.aggregation.scatter
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter-kw :refer (sql-str)]
            [clojure.walk :refer (keywordize-keys stringify-keys)]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-x-name column-y-name column-size-name column-category-name filter-sql aggregation-method max-points column-label-name column-bucket-name]
  (rest (jdbc/query tenant-conn
                    [(format sql-text
                             column-x-name column-y-name column-size-name column-category-name table-name filter-sql aggregation-method max-points column-label-name column-bucket-name)]
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
  (let [columns (keywordize-keys columns)
        query (keywordize-keys query)
        filter-sql (sql-str columns (:filters query))
        column-x (find-column columns (:metricColumnX query))
        column-y (find-column columns (:metricColumnY query))
        column-size (find-column columns (:metricColumnSize query))
        column-category (find-column columns (:bucketColumnCategory query))
        column-label (find-column columns (:datapointLabelColumn query))
        column-bucket (find-column columns (:bucketColumn query))
        max-points 2500
        have-aggregation (boolean column-bucket)
        aggregation-method (:metricAggregation query)

        sql-text-with-aggregation (str "SELECT "
                                       (sql-aggregation-subquery aggregation-method "%1$s" (:type column-x))
                                       " AS x, "
                                       (sql-aggregation-subquery aggregation-method "%2$s" (:type column-y))
                                       " AS y, "
                                       (sql-aggregation-subquery aggregation-method "%3$s" (:type column-size))
                                       " AS size, "
                                       (sql-aggregation-subquery aggregation-method "%4$s" (:type column-category))
                                       " AS category, %10$s AS label FROM (SELECT * FROM %5$s WHERE %6$s ORDER BY random() LIMIT %8$s)z GROUP BY %10$s")
        sql-text-without-aggregation "
          SELECT * FROM (SELECT * FROM (SELECT %1$s AS x, %2$s AS y, %3$s AS size, %4$s AS category, %9$s AS label FROM %5$s WHERE %6$s)z ORDER BY random() LIMIT %8$s)zz ORDER BY zz.x"
        sql-text (if have-aggregation sql-text-with-aggregation sql-text-without-aggregation)
        sql-response (run-query tenant-conn table-name sql-text (:columnName column-x) (:columnName column-y) (:columnName column-size)  (:columnName column-category) filter-sql aggregation-method max-points (:columnName column-label) (:columnName column-bucket))]
    (lib/ok
     {:series (conj [{:key (:title column-x)
                        :label (:title column-x)
                        :data (mapv (fn [[x-value y-value size-value category-value label]]
                                        {:value x-value})
                                      sql-response)
                        :metadata {:type (:type column-x)}}
                      {:key (:title column-y)
                        :label (:title column-y)
                        :data (mapv (fn [[x-value y-value size-value category-value label]]
                                      {:value y-value})
                                    sql-response)
                        :metadata  {:type (:type column-y)}}]
                      (when (:title column-size) 
                        {:key (:title column-size)
                        :label (:title column-size)
                        :data (mapv (fn [[x-value y-value size-value category-value label]]
                                        {:value size-value})
                                      sql-response)
                        :metadata  {:type (:type column-size)}})
                      (when (:title column-category)
                        {:key (:title column-category)
                        :label (:title column-category)
                        :data (mapv (fn [[x-value y-value size-value category-value label]]
                                        {:value category-value})
                                      sql-response)
                         :metadata  {:type (:type column-category)}}))
      :common {:metadata {:type (:type column-label)
                            :sampled (= (count sql-response) max-points)}
                :data (mapv (fn [[x-value y-value size-value category-value label]]
                               {:label label})
                             sql-response)}})))
