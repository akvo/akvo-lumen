(ns akvo.lumen.lib.dataset-impl
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.import :as import]
            [akvo.lumen.lib :as lib]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql]))


(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/job-execution.sql")


(defn all [tenant-conn]
  (lib/ok (all-datasets tenant-conn)))

(defn create [tenant-conn config jwt-claims body]
  (import/handle-import-request tenant-conn config jwt-claims body))

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
  (if-let [dataset (dataset-by-id conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))
          data (rest (jdbc/query conn
                                 [(select-data-sql (:table-name dataset) columns)]
                                 {:as-arrays? true}))]
      (lib/ok
       {:id id
        :name (:title dataset)
        :modified (:modified dataset)
        :created (:created dataset)
        :status "OK"
        :transformations (:transformations dataset)
        :columns columns
        :rows data}))
    (lib/not-found {:error "Not found"})))


(defn delete [tenant-conn id]
  (let [c (delete-dataset-by-id tenant-conn {:id id})]
    (if (zero? c)
      (do
        (delete-failed-job-execution-by-id tenant-conn {:id id})
        (lib/not-found {:error "Not found"}))
      (lib/ok {:id id}))))
