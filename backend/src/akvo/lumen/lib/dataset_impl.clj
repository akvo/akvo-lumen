(ns akvo.lumen.lib.dataset-impl
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.import :as import]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.update :as update]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/job-execution.sql")

(defn all [tenant-conn]
  (lib/ok (all-datasets tenant-conn)))

(defn create [tenant-conn config jwt-claims body]
  (import/handle-import-request tenant-conn config jwt-claims body))

(defn column-sort-order
  "Return this columns sort order (an integer) or nil if the dataset
  is not sorted by this column"
  [column]
  (get column "sort"))

(defn select-data-sql [table-name columns]
  (let [select-expr (->> columns
                         (map (fn [{:strs [type columnName]}]
                                (condp = type
                                  "geopoint" (format "ST_AsText(%s)" columnName)
                                  "geoshape" "NULL" ;; We don't send shapes to the dataset view due to size
                                  columnName)))
                         (str/join ", "))
        order-by-expr (as-> columns cols
                        (filter column-sort-order cols)
                        (sort-by column-sort-order cols)
                        (mapv #(format "%s %s" (get % "columnName") (get % "direction")) cols)
                        (conj cols "rnum")
                        (str/join ", " cols))]
    (format "SELECT %s FROM %s ORDER BY %s"
            select-expr
            table-name
            order-by-expr)))

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

(defn update [tenant-conn config dataset-id {refresh-token "refreshToken"}]
  (if-let [{data-source-spec :spec
            data-source-id :id} (data-source-by-dataset-id tenant-conn
                                                           {:dataset-id dataset-id})]
    (if-not (= (get-in data-source-spec ["source" "kind"])
               "DATA_FILE")
      (update/update-dataset tenant-conn
                             config
                             dataset-id
                             data-source-id
                             (assoc-in data-source-spec
                                       ["source" "refreshToken"]
                                       refresh-token))
      (lib/bad-request {:error "Can't update uploaded dataset"}))
    (lib/not-found {:id dataset-id})))
