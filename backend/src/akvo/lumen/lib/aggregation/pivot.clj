(ns akvo.lumen.lib.aggregation.pivot
  (:require [akvo.commons.psql-util]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn run-query [conn query-str]
  (rest (jdbc/query conn [query-str] {:as-arrays? true})))

(defn coalesce
  "For pivot tables, `NULL` categories will always be empty because `crosstab` uses `=` and
   `NULL = NULL` is `NULL`. To work around this, we must use another value to represent the
   empty value. For dates, we use 1001-01-01 01:00:00"
  [column]
  (format "COALESCE(%s, %s)"
          (get column :columnName)
          (if (= "text" (get column :type))
            "''"
            (if (= "date" (get column :type))
              "'1001-01-01 01:00:00'::timestamptz"
              "'NaN'::double precision"))))

(defn unique-values-sql [table-name category-column filter-str]
  (format "SELECT DISTINCT %s%s FROM %s WHERE %s ORDER BY 1"
          (coalesce category-column)
          (if (= "timestamptz" (get category-column :type)) "::timestamptz::date" "")
          table-name
          filter-str))

(defn unique-values [conn table-name category-column filter-str]
  (->> (unique-values-sql table-name category-column filter-str)
       (run-query conn)
       (map first)))

(defn source-sql [table-name
                  {:keys [category-column
                          row-column
                          value-column
                          aggregation]}
                  filter-str]
  (format "SELECT %s, %s, %s(%s) FROM %s WHERE %s GROUP BY 1,2 ORDER BY 1,2"
          (get row-column :columnName)
          (coalesce category-column)
          aggregation
          (get value-column :columnName)
          table-name
          filter-str))

(defn pivot-sql [table-name query filter-str categories-count]
  (format "SELECT * FROM crosstab ($$ %s $$, $$ %s $$) AS ct (c1 text, %s);"
          (source-sql table-name query filter-str)
          (unique-values-sql table-name (:category-column query) filter-str)
          (str/join "," (map #(format "c%s double precision" (+ % 2))
                             (range categories-count)))))

(defn apply-pivot [conn dataset query filter-str]
  (let [categories (unique-values conn
                                  (:table-name dataset)
                                  (:category-column query)
                                  filter-str)
        category-columns (map (fn [title]
                                {:title title
                                 :type "number"})
                              categories)
        columns (cons (select-keys (:row-column query)
                                   [:title :type])
                      category-columns)]
    {:rows (run-query conn (pivot-sql (:table-name dataset)
                                      query
                                      filter-str
                                      (count categories)))
     :columns columns}))

(defn apply-empty-query [conn dataset filter-str]
  (let [count (run-query conn (format "SELECT count(rnum) FROM %s WHERE %s"
                                      (:table-name dataset)
                                      filter-str))]
    {:columns [{:type "number"
                :title "Total"}]
     :rows count}))

(defn apply-empty-category-query [conn dataset query filter-str]
  (let [rows (->> (format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                          (coalesce (get query :row-column))
                          (:table-name dataset)
                          filter-str)
                  (run-query conn))]
    {:columns [{:type "text"
                :title (get-in query [:row-column :title])}
               {:type "number"
                :title "Total"}]
     :rows rows}))

(defn apply-empty-row-query [conn dataset query filter-str]
  (let [counts (->> (format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                            (coalesce (get query :category-column))
                            (:table-name dataset)
                            filter-str)
                    (run-query conn))]
    {:columns (cons {:title ""
                     :type "text"}
                    (map (fn [[category]]
                           {:title category
                            :type "number"})
                         counts))
     :rows [(cons "Total" (map second counts))]}))

(defn apply-empty-value-query [conn dataset query filter-str]
  (apply-pivot conn
               dataset
               (assoc query
                      :value-column {:columnName "rnum"}
                      :aggregation "count")
               filter-str))

(defn apply-query [conn dataset query filter-str]
  (cond
    (and (nil? (:row-column query))
         (nil? (:category-column query)))
    (apply-empty-query conn dataset filter-str)
    (nil? (:category-column query))
    (apply-empty-category-query conn dataset query filter-str)
    (nil? (:row-column query))
    (apply-empty-row-query conn dataset query filter-str)
    (nil? (:value-column query))
    (apply-empty-value-query conn dataset query filter-str)
    :else (apply-pivot conn dataset query filter-str)))

(defn build-query
  "Replace column names with proper column metadata from the dataset"
  [columns query]
  (merge {:aggregation (condp = (:aggregation query)
                         "mean" "avg"
                         "sum" "sum"
                         "min" "min"
                         "max" "max"
                         "count" "count"
                         (throw (ex-info "Unsupported aggregation function"
                                         {:aggregation (:aggregation query)})))}
         (when-let [c (utils/find-column columns (:categoryColumn query)) ]
           {:category-column c})
         (when-let [c (utils/find-column columns (:rowColumn query)) ]
           {:row-column c})
         (when-let [c (utils/find-column columns (:valueColumn query)) ]
           {:value-column c})
         (when-let [f (:filters query) ]
           {:filters f})))

(defn query [tenant-conn dataset query]
  (let [columns (:columns dataset)
        query (build-query columns query)
        filter-str (filter/sql-str columns (:filters query))]
    (lib/ok (merge (apply-query tenant-conn dataset query filter-str)
                   {:metadata
                    {:categoryColumnTitle (get-in query [:category-column :title])}}))))
