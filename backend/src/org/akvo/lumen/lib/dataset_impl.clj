(ns org.akvo.lumen.lib.dataset-impl
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.import :as import]
            [org.akvo.lumen.endpoint.job-execution :as job-execution]))


(hugsql/def-db-fns "org/akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "org/akvo/lumen/job-execution.sql")


(defn create [tenant-conn config jwt-claims body]
  (let [i (import/handle-import-request tenant-conn config jwt-claims body)]
    ;; i is {:status 200, :headers {}, :body {"importId" "57cffd3f-35ab-4bd0-b09b-b4452d84451d"}}
    (:body i)
    ))

(defn select-data-sql [table-name columns]
  (let [column-names (map #(get % "columnName") columns)
        f (fn [m] (get m "sort"))
        sort-columns (conj
                      (vec
                       (for [c (sort-by f (filter f columns))]
                         (str (get c "columnName") " " (get c "direction"))))
                      "rnum")
        order-by-expr (str/join "," sort-columns)
        sql (format "SELECT %s FROM %s ORDER BY %s"
                    (str/join "," column-names)
                    table-name
                    order-by-expr)]
    sql))

(defn fetch [conn id]
  (when-let [dataset (dataset-by-id conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))
          data (rest (jdbc/query conn
                                 [(select-data-sql (:table-name dataset) columns)]
                                 {:as-arrays? true}))]
      {:id id
       :name (:title dataset)
       :modified (:modified dataset)
       :created (:created dataset)
       :status "OK"
       :transformations (:transformations dataset)
       :columns columns
       :rows data})))


(defn delete [tenant-conn id]
  (let [c (delete-dataset-by-id tenant-conn {:id id})]
    (if (zero? c)
      (do
        (delete-failed-job-execution-by-id tenant-conn {:id id})
        nil)
      {:id id})))
