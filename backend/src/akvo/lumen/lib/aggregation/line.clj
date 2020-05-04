(ns akvo.lumen.lib.aggregation.line
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.commons :refer (run-query) :as commons]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
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

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [column-x      (find-column columns (:metricColumnX query))
        column-y      (find-column columns (:metricColumnY query))
        max-points    2500
        aggregation (aggregation* (:metricAggregation query) column-y)
        sql-text (format "SELECT %1$s AS x, %2$s AS y FROM %3$s WHERE %4$s %5$s ORDER BY x"
                              (:columnName column-x)
                              (or aggregation (:columnName column-y))
                              table-name
                              (sql-str columns (:filters query))
                              (if aggregation (format  "GROUP BY %s" (:columnName column-x)) ""))
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
