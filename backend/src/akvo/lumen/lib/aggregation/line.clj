(ns akvo.lumen.lib.aggregation.line
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method max-points]
  (prn
   (format sql-text
           column-x-name column-y-name table-name filter-sql aggregation-method max-points))
  (rest (jdbc/query tenant-conn
                    [(format sql-text
                             column-x-name column-y-name table-name filter-sql aggregation-method max-points)]
                    {:as-arrays? true})))

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (filter/sql-str columns (get query "filters"))
        column-x (utils/find-column columns (get query "metricColumnX"))
        column-x-type (get column-x "type")
        column-x-name (get column-x "columnName")
        column-x-title (get column-x "title")
        column-y (utils/find-column columns (get query "metricColumnY"))
        column-y-type (get column-y "type")
        column-y-name (get column-y "columnName")
        column-y-title (get column-y "title")
        max-points 2500
        aggregation-method (get query "metricAggregation")
        aggregation-method  (if (= column-y-type "text") "count" aggregation-method)
        sql-aggregation-subquery (case aggregation-method
                                   nil ""
                                   ("min" "max" "count" "sum") (str aggregation-method  "(%2$s)")
                                   "mean" "avg(%2$s)"
                                   "median" "percentile_cont(0.5) WITHIN GROUP (ORDER BY %2$s)"
                                   "distinct" "COUNT(DISTINCT %2$s)"
                                   "q1" "percentile_cont(0.25) WITHIN GROUP (ORDER BY %2$s)"
                                   "q3" "percentile_cont(0.75) WITHIN GROUP (ORDER BY %2$s)")
        sql-text-with-aggregation (str "SELECT * FROM (SELECT * FROM (SELECT %1$s, " sql-aggregation-subquery " FROM %3$s WHERE %4$s GROUP BY %1$s)z ORDER BY random() LIMIT %6$s)zz ORDER BY zz.%1$s")
        sql-text-without-aggregation "SELECT * FROM (SELECT * FROM (SELECT %1$s AS x, %2$s AS y FROM %3$s WHERE %4$s)z ORDER BY random() LIMIT %6$s)zz ORDER BY zz.x"
        sql-text-no-x (str "SELECT row_number() over() AS x, " (if (= column-y-type "text") "COUNT(%2$s) AS y " "%2$s AS y ") "FROM %3$s WHERE %4$s GROUP BY %2$s")
        sql-text (cond
                   (not column-x) sql-text-no-x
                   aggregation-method sql-text-with-aggregation
                   :else sql-text-without-aggregation)
        sql-response (run-query tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method max-points)]
    (lib/ok
     {"series" [{"key" column-y-title
                 "label" column-y-title
                 "data" (mapv (fn [[x-value y-value]]
                                {"value" y-value})
                              sql-response)}]
      "common" {"metadata" {"type" column-x-type "sampled" (= (count sql-response) max-points)}
                "data" (mapv (fn [[x-value y-value]]
                               {"timestamp" x-value})
                             sql-response)}})))
