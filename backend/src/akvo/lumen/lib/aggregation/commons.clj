(ns akvo.lumen.lib.aggregation.commons
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]))

(defn run-query [tenant-conn sql]
  (log/debug :run-query sql)
  (rest (jdbc/query tenant-conn [sql] {:as-arrays? true})))

(defn cast-to-decimal [column]
  (case (:type column)
    "number" (:columnName column)
    "date" (format "(1000 * cast(extract(epoch from %s) as decimal))" (:columnName column))
    (:columnName column)))

(defn sql-aggregation-subquery [aggregation-method column]
  (when column
    (let [v (cast-to-decimal column)]
      (case aggregation-method
        nil ""
        ("min" "max" "count" "sum") (str aggregation-method "(" v "::decimal)")
        "mean" (str "avg(" v "::decimal)")
        "median" (str "percentile_cont(0.5) WITHIN GROUP (ORDER BY " v ")")
        "distinct" (str "COUNT(DISTINCT " v ")")
        "q1" (str "percentile_cont(0.25) WITHIN GROUP (ORDER BY " v ")")
        "q3" (str "percentile_cont(0.75) WITHIN GROUP (ORDER BY " v ")")))))

(defmulti spec-columns
  "returns the distinct column names used in the spec"
  (fn [visualisation-type spec dataset-id]
    visualisation-type))

(defmethod spec-columns :default
  [visualisation-type spec dataset-id]
  [])

(defmethod spec-columns "map"
  [visualisation-type spec dataset-id]
  (->>
   (:layers spec)
   (filter #(= dataset-id (:datasetId %)) )
   (mapv
    #(distinct (filter some? (flatten [(map :column (:popup %))
                                       (map :column (:filters %))
                                       (:pointColorColumn %)
                                       (:geom %)
                                       (:aggregationGeomColumn %)
                                       (:aggregationColumn %)

                                       ])))
    )
   flatten
   vec)
)




