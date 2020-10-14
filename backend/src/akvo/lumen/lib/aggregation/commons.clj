(ns akvo.lumen.lib.aggregation.commons
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.spec.alpha :as s]
            [akvo.lumen.specs.db.dataset-version.column :as s.column]
            [clojure.tools.logging :as log]
            [clojure.string :as str]))

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
    (format "unnest(regexp_split_to_array(%1$s,'\\|'))" (:columnName bucket-column))
    (:columnName bucket-column)))

(defn data-groups-sql-template
  "Returns a data structure useful to generate a SELECT statement with the data groups passed as
  parameter. We keep all columns for `metadata` groupId, and we *drop* `rnum` and `instance_id`
  from all other data groups."
  [data-groups]
  (let [adapted-dgs (reduce
                     (fn [dgs {:keys [columns groupId table-name]}]
                       (conj dgs
                             {:table-name table-name
                              :columns (if (= groupId "metadata")
                                         columns
                                         (remove (fn [{:keys [columnName]}]
                                                   (or (= "instance_id" columnName)
                                                       (= "rnum" columnName)))
                                                 columns))}))
                     []
                     data-groups)]
    {:select (mapv :columnName (flatten (map :columns adapted-dgs)))
     :from (mapv :table-name adapted-dgs)}))

(defn data-groups-sql
  [template]
  (str/join " "
            [(str "SELECT " (str/join ", "
                                      (:select template)))
             (str "FROM " (str/join ", "
                                    (:from template)))
             (when (> (count (:from template)) 1)
               (str "WHERE " (str/join " AND "
                                       (let [dt-1 (first (:from template))]
                                         (for [dt-n (rest (:from template))]
                                           (format "%s.instance_id=%s.instance_id" dt-1 dt-n))))))]))

(defn data-groups-temp-view
  [view-name sql]
  (format "CREATE TEMP VIEW %s AS %s" view-name sql))
