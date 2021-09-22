(ns akvo.lumen.lib.aggregation.commons
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.spec.alpha :as s]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.util :as util]
            [akvo.lumen.specs.db.dataset-version.column :as s.column]
            [clojure.tools.logging :as log]
            [clojure.string :as str]
            [clojure.walk :as walk]))

(defmulti cols*
  (fn [visualisation-type query]
    visualisation-type))

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

(defn sql-option-bucket-column [bucket-column]
  (if (= "option" (:type bucket-column))
    (format "unnest(case when %1$s IS NULL
                         THEN ARRAY[NULL]::text[]
                         else case when %1$s = ''
                                   then ARRAY['']::text[]
                                   else array_remove(regexp_split_to_array(%1$s,'\\|'), '')
                                   end
                         end)" (:columnName bucket-column))
    (:columnName bucket-column)))
