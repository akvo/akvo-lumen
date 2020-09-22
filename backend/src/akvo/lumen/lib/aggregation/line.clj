(ns akvo.lumen.lib.aggregation.line
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.commons :refer (run-query) :as commons]
            [akvo.lumen.lib.dataset.utils :refer (find-column from-clause)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]))

(defn aggregation* [metricAggregation column-y]
  (when-let [aggregation-method (if (= (:type column-y) "text") "count" metricAggregation)]
    (format (case aggregation-method
              ("min" "max" "count" "sum") (str aggregation-method  "(%s)")
              "mean"                      "avg(%s)"
              "median"                    "percentile_cont(0.5) WITHIN GROUP (ORDER BY %s)"
              "distinct"                  "COUNT(DISTINCT %s)"
              "q1"                        "percentile_cont(0.25) WITHIN GROUP (ORDER BY %s)"
              "q3"                        "percentile_cont(0.75) WITHIN GROUP (ORDER BY %s)")
            (:columnName column-y))))

(defn query-v1
  "DEPRECATED: version 1 works with sampling data, only current vizs without further modifications will use this version,
   following modifications will use version 2 and user will be prompt to use aggregation facilities if sql results are
   higher than 2.5K rows"
  [tenant-conn ds-versions query]
  (let [columns   (reduce #(into % (:columns %2)) [] ds-versions)
        column-x      (find-column columns (:metricColumnX query))
        column-y      (find-column columns (:metricColumnY query))
        max-points    2500
        aggregation (aggregation* (:metricAggregation query) column-y)
        sql-text (format "SELECT * FROM 
                                (SELECT * 
                                 FROM (SELECT %1$s AS x, %2$s AS y FROM %3$s WHERE %4$s %5$s )z 
                                 ORDER BY random() 
                                 LIMIT %6$s)zz 
                               ORDER BY zz.x"
                              (:columnName column-x)
                              (or aggregation (:columnName column-y))
                              (from-clause (map :table-name ds-versions))
                              (sql-str columns (:filters query))
                              (if aggregation (format  "GROUP BY %s" (:columnName column-x)) "")
                              max-points)
        sql-response  (run-query tenant-conn sql-text)]
    (lib/ok
     {:series [{:key   (column-y :title)
                :label (column-y :title)
                :data  (mapv (fn [[x-value y-value]]
                               {:value y-value})
                             sql-response)}]
      :common {:metadata {:type    (:type column-x)
                          :sampled (= (count sql-response) max-points)}
               :data     (mapv (fn [[x-value y-value]]
                                 {:timestamp x-value})
                               sql-response)}})))

(defn query-v2
  [tenant-conn ds-versions query]
  (let [columns   (reduce #(into % (:columns %2)) [] ds-versions)
        column-x      (find-column columns (:metricColumnX query))
        column-y      (find-column columns (:metricColumnY query))
        max-points    2500
        aggregation (aggregation* (:metricAggregation query) column-y)
        sql-text (format "SELECT %1$s AS x, %2$s AS y FROM %3$s WHERE %4$s %5$s ORDER BY x"
                              (:columnName column-x)
                              (or aggregation (:columnName column-y))
                              (from-clause (map :table-name ds-versions))
                              (sql-str columns (:filters query))
                              (if aggregation (format  "GROUP BY %s" (:columnName column-x)) ""))
        sql-response  (run-query tenant-conn sql-text)]
    (if (< (count sql-response) max-points)
      (lib/ok
       {:series [{:key   (column-y :title)
                  :label (column-y :title)
                  :data  (mapv (fn [[x-value y-value]]
                                 {:value y-value})
                               sql-response)}]
        :common {:metadata {:type    (:type column-x)}
                 :data     (mapv (fn [[x-value y-value]]
                                   {:timestamp x-value})
                                 sql-response)}})
      (lib/bad-request
       {:message (format "Results are more than %d. Please select another column or use a different aggregation."
                         max-points)}))))

(defn query [tenant-conn data query]
  (if (= 1 (:version query))
    (query-v1 tenant-conn data query)
    (query-v2 tenant-conn data query)))
