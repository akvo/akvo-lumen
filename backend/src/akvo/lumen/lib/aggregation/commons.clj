(ns akvo.lumen.lib.aggregation.commons
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.spec.alpha :as s]
            [akvo.lumen.specs.db.dataset-version.column :as s.column]
            [clojure.tools.logging :as log]))

(def default-max-points 500000)

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

(defn spec-columns
  "returns `#{column-name...}` found in `data` arg. Logic based on clojure.spec/def `spec`
   Based on dynamic thread binding.
   Follows same approach of https://github.com/akvo/akvo-lumen/issues/1949"
  [spec data]
  (let [column-names  (atom #{})
        add-column-name (fn [column-name]
                          (when column-name
                            (swap! column-names conj column-name)))]
    (binding [s.column/*columnName?* add-column-name]
      (let [explain-str (s/explain-str spec data)]
        (if-not (= "Success!\n" explain-str)
          (let [ex (ex-info
                    (format "We can't derive visualisation related columns thus it doesn't conform spec. (Id: %s)" (:id data))
                    {:data data
                     :spec-message explain-str})]
            (log/error ex)
            (throw ex))
          (deref column-names))))))
