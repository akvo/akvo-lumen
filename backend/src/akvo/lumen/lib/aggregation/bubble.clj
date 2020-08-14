(ns akvo.lumen.lib.aggregation.bubble
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.commons :refer (run-query) :as commons]
            [akvo.lumen.lib.aggregation.scatter :as scatter]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]))

(defn sql-aggregation-subquery [aggregation-method column]
  (if (= aggregation-method "count")
    (let [sql-type (if (#{"number" "data"} (:type column)) "::decimal" "::text")]
      (format "count(%1$s%2$s)" (:columnName column) sql-type))
    (commons/sql-aggregation-subquery aggregation-method column)))

(defn query-v1
  "DEPRECATED: version 1 works with sampling data, only current vizs without further modifications will use this version,
   following modifications will use version 2 and user will be prompt to use aggregation facilities if sql results are
   higher than 2.5K rows"
  [tenant-conn {:keys [columns table-name]} query]
  (let [column-size  (find-column columns (:metricColumn query))
        column-bucket (find-column columns (:bucketColumn query))
        max-points 2500
        aggregation-method (if column-size (:metricAggregation query) "count")
        subquery (format "(SELECT * FROM %1$s WHERE %2$s ORDER BY random() LIMIT %3$s)z "
                         table-name
                         (sql-str columns (:filters query))
                         max-points)
        sql-text (format "SELECT %1$s AS size, %2$s AS label 
                          FROM %3$s 
                          GROUP BY %2$s"
                         (sql-aggregation-subquery aggregation-method (or column-size column-bucket))
                         (:columnName column-bucket) ;; maybe we need to use => (or c-size c-bucket)
                         subquery)
        sql-response (run-query tenant-conn sql-text)]
    (lib/ok
     {:series [{:key      (:title column-size)
                :label    (:title column-size)
                :data     (mapv (fn [[size-value label]] {:value size-value}) sql-response)
                :metadata {:type (:type column-size)}}]
      :common {:metadata {:sampled (= (count sql-response) max-points)}
               :data     (mapv (fn [[size-value label]] {:label label :key label}) sql-response)}})))

(defn query-v2
  [tenant-conn {:keys [columns table-name]} query]
  (let [column-size  (find-column columns (:metricColumn query))
        column-bucket (find-column columns (:bucketColumn query))
        max-points 2500
        aggregation-method (if column-size (:metricAggregation query) "count")
        subquery (format "(SELECT * FROM %1$s WHERE %2$s)z "
                         table-name
                         (sql-str columns (:filters query)))
        sql-text (format "SELECT %1$s AS size, %2$s AS label 
                          FROM %3$s 
                          GROUP BY %2$s"
                         (sql-aggregation-subquery aggregation-method (or column-size column-bucket))
                         (:columnName column-bucket) ;; maybe we need to use => (or c-size c-bucket)
                         subquery)
        sql-response (run-query tenant-conn sql-text)]
    (if (< (count sql-response) max-points)
      (lib/ok
       {:series [{:key      (:title column-size)
                  :label    (:title column-size)
                  :data     (mapv (fn [[size-value label]] {:value size-value}) sql-response)
                  :metadata {:type (:type column-size)}}]
        :common {:metadata {}
                 :data     (mapv (fn [[size-value label]] {:label label :key label}) sql-response)}})
      (lib/bad-request
       {:message (format "Results are more than %d. Please select another column or use a different aggregation."
                         max-points)}))))

(defn query [tenant-conn data query]
  (if (= 1 (:version query))
    (query-v1 tenant-conn data query)
    (query-v2 tenant-conn data query)))
