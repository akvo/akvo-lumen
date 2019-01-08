(ns akvo.lumen.lib.aggregation.pivot
  (:require [akvo.commons.psql-util]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn- run-query [conn query-str]
  (rest (jdbc/query conn [query-str] {:as-arrays? true})))

(defn- coalesce
  "For pivot tables, `NULL` categories will always be empty because `crosstab` uses `=` and
   `NULL = NULL` is `NULL`. To work around this, we must use another value to represent the
   empty value. For dates, we use 1001-01-01 01:00:00"
  [column]
  (format "COALESCE(%s, %s)"
          (:columnName column)
          (if (= "text" (:type column))
            "''"
            (if (= "date" (:type column))
              "'1001-01-01 01:00:00'::timestamptz"
              "'NaN'::double precision"))))

(defn- apply-pivot [conn table-name {:keys [category-column row-column] :as query} filter-str]
  (let [source-sql        (fn [table-name {:keys [category-column row-column value-column aggregation]} filter-str]
                            (format "SELECT %s, %s, %s(%s) FROM %s WHERE %s GROUP BY 1,2 ORDER BY 1,2"
                                    (:columnName row-column) (coalesce category-column) aggregation
                                    (:columnName value-column) table-name filter-str))
        unique-values-sql (fn [table-name category-column filter-str]
                            (format "SELECT DISTINCT %s%s FROM %s WHERE %s ORDER BY 1"
                                    (coalesce category-column)
                                    (if (= "timestamptz" (:type category-column)) "::timestamptz::date" "")
                                    table-name
                                    filter-str))
        pivot-sql         (fn [table-name {:keys [category-column] :as query}
                               filter-str categories-count]
                            (format "SELECT * FROM crosstab ($$ %s $$, $$ %s $$) AS ct (c1 text, %s);"
                                    (source-sql table-name query filter-str)
                                    (unique-values-sql table-name category-column filter-str)
                                    (str/join "," (map #(format "c%s double precision" (+ % 2))
                                                       (range categories-count)))))
        unique-values     (fn [conn table-name category-column filter-str]
                            (->> (unique-values-sql table-name category-column filter-str)
                                 (run-query conn)
                                 (map first)))
        categories        (unique-values conn table-name category-column filter-str)
        category-columns  (map (fn [title] {:title title :type "number"}) categories)
        columns           (cons (select-keys row-column [:title :type]) category-columns)]
    {:rows    (run-query conn (pivot-sql table-name query filter-str (count categories)))
     :columns columns}))

(defn apply-query [conn table-name {:keys [row-column category-column value-column] :as query} filter-str]
  (cond

    (and (nil? row-column)
         (nil? category-column))
    {:columns [{:type "number" :title "Total"}]
     :rows    (run-query conn (format "SELECT count(rnum) FROM %s WHERE %s"
                                      table-name
                                      filter-str))}

    (nil? category-column)
    (let [rows (->> (format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                            (coalesce (:row-column query))
                            table-name
                            filter-str)
                    (run-query conn))]
      {:columns [{:type  "text"
                  :title (get-in query [:row-column :title])}
                 {:type  "number"
                  :title "Total"}]
       :rows    rows})

    (nil? row-column)
    (let [counts (->> (format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                              (coalesce (:category-column query))
                              table-name
                              filter-str)
                      (run-query conn))]
      {:columns (cons {:title ""
                       :type  "text"}
                      (map (fn [[category]]
                             {:title category
                              :type  "number"})
                           counts))
       :rows    [(cons "Total" (map second counts))]})

    (nil? value-column)
    (apply-pivot conn table-name (assoc query
                                        :value-column {:columnName "rnum"}
                                        :aggregation "count") filter-str)

    :else
    (apply-pivot conn table-name query filter-str)))

(defn build-query
  "Replace column names with proper column metadata from the dataset"
  [columns query]
  {:category-column (find-column columns (:categoryColumn query))
   :row-column      (find-column columns (:rowColumn query))
   :value-column    (find-column columns (:valueColumn query))
   :aggregation     (condp = (:aggregation query)
                      "mean"  "avg"
                      "sum"   "sum"
                      "min"   "min"
                      "max"   "max"
                      "count" "count"
                      (throw (ex-info "Unsupported aggregation function"
                                      {:aggregation (:aggregation query )})))
   :filters         (:filters query)})

(defn query [tenant-conn {:keys [columns table-name]} query]
  (let [query      (build-query columns query)
        filter-str (sql-str columns (:filters query))]
    (lib/ok (merge (apply-query tenant-conn table-name query filter-str)
                   {:metadata
                    {:categoryColumnTitle (get-in query [:category-column :title])}}))))
