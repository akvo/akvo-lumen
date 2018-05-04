(ns akvo.lumen.lib.aggregation.line
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name sql-text column-x-name column-y-name filter-sql aggregation-method max-points]
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
        column-y-name (get column-y "columnName")
        column-y-title (get column-y "title")
        max-points 2500
        aggregation-method (if (= (get query "metricAggregation") "mean") "avg" (get query "metricAggregation"))
        sql-text-with-aggregation "SELECT * FROM (SELECT * FROM (SELECT %1$s, %5$s(%2$s) FROM %3$s WHERE %4$s GROUP BY %1$s)z ORDER BY random() LIMIT %6$s)zz ORDER BY zz.%1$s"
        sql-text-without-aggreagtion "SELECT * FROM (SELECT * FROM (SELECT %1$s, %2$s FROM %3$s WHERE %4$s)z ORDER BY random() LIMIT %6$s)zz ORDER BY zz.%1$s"
        sql-text (if aggregation-method sql-text-with-aggregation sql-text-without-aggreagtion)
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
