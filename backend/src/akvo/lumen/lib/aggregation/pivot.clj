(ns akvo.lumen.lib.aggregation.pivot
  (:require [akvo.commons.psql-util]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.commons :refer (run-query)]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.postgres.filter :refer (sql-str)]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.tools.logging :as log]))

(defn- coalesce
  "For pivot tables, `NULL` categories will always be empty because `crosstab` uses `=` and
   `NULL = NULL` is `NULL`. To work around this, we must use another value to represent the
   empty value. For dates, we use 1001-01-01 01:00:00"
  [column]
  (format "COALESCE(%s, %s)" (:columnName column) (case (:type column)
                                                    "text" "''"
                                                    "date" "'1001-01-01 01:00:00'::timestamptz"
                                                    "'NaN'::double precision")))

(defn unique-values-sql [table-name filter-str category-column]
  (let [select (format "SELECT DISTINCT %s%s"
                       (coalesce category-column) (if (= "timestamptz"
                                                         (:type category-column))
                                                    "::timestamptz::date"
                                                    ""))
        from   (format "FROM %s" table-name)
        where  (format "WHERE %s ORDER BY 1" filter-str)]
    (format "%s %s %s" select from where)))

(defn run-query-categories [conn table-name filter-str category-column]
  (->> (unique-values-sql table-name filter-str category-column)
       (run-query conn)
       (map first)))

(defn- run-pivot-query
  [conn table-name {:keys [category-column row-column aggregation value-column]} filter-str categories]
  (let [source-sql        (let [select (format "SELECT %s, %s, %s(%s)"
                                               (:columnName row-column)
                                               (coalesce category-column)
                                               aggregation
                                               (:columnName value-column))
                                from   (format "FROM %s" table-name)
                                where  (format "WHERE %s GROUP BY 1,2 ORDER BY 1,2" filter-str)]
                            (format "%s %s %s" select from where))
        pivot-sql (let [select "SELECT *"
                        from   (format "FROM crosstab ($$ %s $$, $$ %s $$) AS ct (c1 text, %s)"
                                       source-sql
                                       (unique-values-sql table-name filter-str category-column)
                                       (str/join "," (map #(format "c%s double precision" (+ % 2))
                                                          (range (count categories)))))
                        where  ""]
                    (format "%s %s %s" select from where))]
    (run-query conn pivot-sql)))


(defn- apply-pivot
  [conn table-name {:keys [category-column row-column] :as query} filter-str]
  (if-let [categories (not-empty (run-query-categories conn table-name
                                                       filter-str category-column))]
    {:columns (->> categories
                   (map (fn [title] {:title title :type "number"}))
                   (cons (select-keys row-column [:title :type])))
     :rows    (run-pivot-query conn table-name query filter-str categories)}
    {:columns []
     :rows [[]]}))

(defn apply-query [conn table-name {:keys [row-column category-column value-column] :as query} filter-str]
  (cond

    (and (nil? row-column) (nil? category-column))
    {:columns [{:type "number" :title "Total"}]
     :rows    (run-query conn (format "SELECT count(rnum) FROM %s WHERE %s"
                                      table-name
                                      filter-str))}

    (nil? category-column)
    {:columns [{:type  "text"
                :title (get-in query [:row-column :title])}
               {:type  "number"
                :title "Total"}]
     :rows    (run-query conn (format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                                      (coalesce (:row-column query))
                                      table-name
                                      filter-str))}

    (nil? row-column)
    (let [data (->> (format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                            (coalesce (:category-column query))
                            table-name
                            filter-str)
                    (run-query conn))]
      {:columns (->> data
                     (map (fn [[category]]
                            {:title category
                             :type  "number"}))
                     (cons {:title ""
                            :type  "text"}))
       :rows    [(->> data
                      (map second)
                      (cons "Total"))]})

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
