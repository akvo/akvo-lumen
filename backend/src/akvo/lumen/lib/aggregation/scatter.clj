(ns akvo.lumen.lib.aggregation.scatter
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn sql]
  (log/info :scatter-sql sql)
  (rest (jdbc/query tenant-conn [sql] {:as-arrays? true})))

(defn cast-to-decimal [column]
  (case (:type column)
    "number" (:columnName column)
    "date" (format "(1000 * cast(extract(epoch from %s) as decimal))" (:columnName column))
    (:columnName column)))

(defn sql-aggregation-subquery [aggregation-method column]
  (let [v (cast-to-decimal column)]
    (case aggregation-method
      nil ""
      ("min" "max" "count" "sum") (str aggregation-method "(" v "::decimal)")
      "mean" (str "avg(" v "::decimal)")
      "median" (str "percentile_cont(0.5) WITHIN GROUP (ORDER BY " v ")")
      "distinct" (str "COUNT(DISTINCT " v ")")
      "q1" (str "percentile_cont(0.25) WITHIN GROUP (ORDER BY " v ")")
      "q3" (str "percentile_cont(0.75) WITHIN GROUP (ORDER BY " v ")"))))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (sql-str columns (:filters query))
        column-x (find-column columns (:metricColumnX query))
        column-y (find-column columns (:metricColumnY query))
        column-size (find-column columns (:metricColumnSize query))
        column-category (find-column columns (:bucketColumnCategory query))
        column-label (find-column columns (:datapointLabelColumn query))
        column-bucket (find-column columns (:bucketColumn query))
        max-points 2500

        aggregation (partial sql-aggregation-subquery (:metricAggregation query))

        subquery (format "(SELECT * FROM %1$s WHERE %2$s ORDER BY random() LIMIT %3$s)z"
                         table-name filter-sql max-points)

        sql-text-with-aggregation
        (format "SELECT %1$s AS x, %2$s AS y, %3$s AS size, %4$s AS category, %5$s AS label 
                 FROM %6$s
                 GROUP BY %5$s"
                (aggregation column-x)
                (aggregation column-y)
                (aggregation column-size)
                (aggregation column-category)
                (:columnName column-bucket)
                subquery)
        sql-text-without-aggregation (format "SELECT * FROM
                                               (SELECT * FROM 
                                                 (SELECT %1$s AS x, %2$s AS y, %3$s AS size, %4$s AS category, %5$s AS label 
                                                  FROM %6$s 
                                                  WHERE %7$s)z
                                                ORDER BY random() 
                                                LIMIT %8$s)zz
                                              ORDER BY zz.x"
                         (:columnName column-x)
                         (:columnName column-y)
                         (:columnName column-size)
                         (:columnName column-category)
                         (:columnName column-label)
                         table-name
                         filter-sql
                         max-points)

        sql-text (if column-bucket sql-text-with-aggregation sql-text-without-aggregation)
        sql-response (run-query tenant-conn sql-text)]
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
