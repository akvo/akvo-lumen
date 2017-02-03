(ns akvo.lumen.lib.pivot-impl
  (:require [akvo.commons.psql-util]
            [akvo.lumen.http :as http]
            [akvo.lumen.lib.visualisation.filter :as filter]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn unique-values-sql [table-name category-column filter-str]
  (format "SELECT DISTINCT %s FROM %s WHERE %s ORDER BY 1"
          (get category-column "columnName") table-name
          filter-str))

(defn unique-values [conn table-name category-column filter-str]
  (->> (jdbc/query conn
                   [(unique-values-sql table-name category-column filter-str)]
                   {:as-arrays? true})
       rest
       (map first)))

;; TODO filter
(defn source-sql [table-name
                  {:keys [category-column
                          row-column
                          value-column
                          aggregation]}
                  filter-str]
  (str
   (format "SELECT %s, %s, %s(%s) FROM %s WHERE %s\n"
           (get row-column "columnName")
           (get category-column "columnName")
           aggregation
           (get value-column "columnName")
           table-name
           filter-str)
   "GROUP BY 1,2 ORDER BY 1,2\n"))

(defn pivot-sql [table-name query filter-str categories-count]
  (str "SELECT * FROM crosstab ($$\n"
       (source-sql table-name query filter-str)
       "$$,$$\n"
       (unique-values-sql table-name (:category-column query) filter-str)
       "$$) AS ct (c1 text, \n"
       (str/join "," (map #(format "c%s double precision" (+ % 2))
                          (range categories-count)))
       ");"))

(defn apply-pivot [conn dataset query filter-str]
  (let [categories (unique-values conn
                                  (:table-name dataset)
                                  (:category-column query)
                                  filter-str)
        category-columns (map (fn [title]
                                {"title" title
                                 "type" "number"})
                              categories)
        columns (cons (select-keys (:row-column query)
                                   ["title" "type"])
                      category-columns)]
    {:rows (rest
            (jdbc/query conn
                        [(pivot-sql (:table-name dataset) query filter-str (count categories))]
                        {:as-arrays? true}))
     :columns columns}))

(defn apply-empty-query [conn dataset filter-str]
  (let [count (rest (jdbc/query conn
                                [(format "SELECT count(rnum) FROM %s WHERE %s"
                                         (:table-name dataset)
                                         filter-str)]
                                {:as-arrays? true}))]
    {:columns [{"type" "number"
                "title" "Total"}]
     :rows count}))

(defn apply-empty-category-query [conn dataset query filter-str]
  (let [rows (rest (jdbc/query conn
                               [(format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                                        (get (:row-column query) "columnName")
                                        (:table-name dataset)
                                        filter-str)]
                               {:as-arrays? true}))]
    {:columns [{"type" "text"
                "title" (get (:row-column query) "title")}
               {"type" "number"
                "title" "Total"}]
     :rows rows}))

(defn apply-empty-row-query [conn dataset query filter-str]
  (let [counts (map second
                    (rest (jdbc/query conn
                                      [(format "SELECT %s, count(rnum) FROM %s WHERE %s GROUP BY 1 ORDER BY 1"
                                               (get (:category-column query) "columnName")
                                               (:table-name dataset)
                                               filter-str)]
                                      {:as-arrays? true})))
        categories (unique-values conn (:table-name dataset) (:category-column query) filter-str)]
    {:columns (cons {"title" ""
                     "type" "text"}
                    (map (fn [category]
                           {"title" category
                            "type" "number"})
                         categories))
     :rows [(cons "Total" counts)]}))

(defn apply-empty-value-query [conn dataset query filter-str]
  (apply-pivot conn
               dataset
               (assoc query
                      :value-column {"columnName" "rnum"}
                      "aggregation" "count")
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

(defn find-column [columns column-name]
  (first (filter #(= column-name (get % "columnName")) columns)))

(defn build-query
  "Replace column names with proper column metadata from the dataset"
  [columns query]
  {:category-column (find-column columns (get query "categoryColumn"))
   :row-column (find-column columns (get query "rowColumn"))
   :value-column (find-column columns (get query "valueColumn"))
   :aggregation (get query "aggregation")
   :filters (get query "filters")})

(defn valid-query? [query]
  true)

(defn query [tenant-conn dataset-id query]
  (jdbc/with-db-transaction [conn tenant-conn]
    (if-let [dataset (dataset-by-id conn {:id dataset-id})]
      (let [q (build-query (:columns dataset) query)]
        (if (valid-query? q)
          (try
            (http/ok (apply-query conn dataset q (filter/sql-str (:columns dataset) (:filters q))))
            (catch clojure.lang.ExceptionInfo e
              (http/bad-request (merge {:message (.getMessage e)}
                                       (ex-data e)))))
          (http/bad-request {"query" query})))
      (http/not-found {"datasetId" dataset-id}))))


(comment
  (def dataset-id "589346d9-9a47-4911-8365-a6023272d2bb")
  (def tenant-conn "jdbc:postgresql://localhost/lumen_tenant_1")

  (def dataset  (dataset-by-id tenant-conn {:id dataset-id}))

  (def q {"categoryColumn" "c16"
          "rowColumn" "c4"
          "valueColumn" "c19"
          "aggregation" "avg"
          "filters" [{"column" "c2"
                      "columnType" "text"
                      "operation" "keep"
                      "strategy" "is"
                      "value" "Ethiopia"}]})

  (def empty-q {"categoryColumn" nil
                "rowColumn" nil
                "valueColumn" nil
                "aggregation" "count"
                "filters" []})

  (def empty-category-q
    {"categoryColumn" nil
     "rowColumn" "c4"
     "valueColumn" nil
     "aggregation" "count"
     "filters" [{"column" "c2"
                 "columnType" "text"
                 "operation" "keep"
                 "strategy" "is"
                 "value" "Ethiopia"}]})

  (def empty-row-q
    {"categoryColumn" "c16"
     "rowColumn" nil
     "valueColumn" nil
     "aggregation" "count"
     "filters" [{"column" "c2"
                 "columnType" "text"
                 "operation" "keep"
                 "strategy" "is"
                 "value" "Ethiopia"}]})

  (def empty-value-q
    {"categoryColumn" "c16"
     "rowColumn" "c4"
     "valueColumn" nil
     "aggregation" "count"
     "filters" [{"column" "c2"
                 "columnType" "text"
                 "operation" "keep"
                 "strategy" "is"
                 "value" "Ethiopia"}]})

  (query tenant-conn dataset-id empty-value-q)

  (unique-categories tenant-conn dataset-id)

  )
