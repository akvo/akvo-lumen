(ns akvo.lumen.lib.dataset
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.visualisation :as db.visualisation]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.transformation.merge-datasets :as transformation.merge-datasets]
            [akvo.lumen.lib.update :as update]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.set :refer (rename-keys)]))

(defn- remove-token [d]
  (update d :source dissoc "token"))

(defn all*
  [tenant-conn]
  (map remove-token (db.dataset/all-datasets tenant-conn)))

(defn create
  [tenant-conn import-config error-tracker claims data-source]
  (import/handle tenant-conn import-config error-tracker claims data-source))

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

(defn fetch-metadata
  "Fetch dataset metadata (everything apart from rows)"
  [tenant-conn id]
  (if-let [dataset (db.dataset/dataset-by-id tenant-conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))]
      (lib/ok
       {:id id
        :name (:title dataset)
        :modified (:modified dataset)
        :created (:created dataset)
        :updated (:updated dataset)
        :status "OK"
        :transformations (:transformations dataset)
        :columns columns}))
    (lib/not-found {:error "Not found"})))

(defn fetch
  [tenant-conn id]
  (when-let [dataset (db.dataset/dataset-by-id tenant-conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))
          data (rest (jdbc/query tenant-conn
                                 [(select-data-sql (:table-name dataset) columns)]
                                 {:as-arrays? true}))]

      
      (-> dataset
          remove-token
          (select-keys [:created :id :modified :status :title :transformations :updated :author :source])
          (rename-keys {:title :name})
          (assoc :rows data :columns columns :status "OK")))))

(defn sort-text
  [tenant-conn id column-name limit order]
  (when-let [dataset (db.dataset/table-name-by-dataset-id tenant-conn {:id id})]
    (let [result (->> (merge {:column-name column-name :table-name (:table-name dataset)}
                        (when limit {:limit limit}))
                   (db.dataset/count-vals-by-column-name tenant-conn)
                   (map (juxt :counter :coincidence)))]
      (cond->> result
        (= "value" order) (sort-by second)))))

(defn sort-number
  [tenant-conn id column-name]
  (when-let [dataset (db.dataset/table-name-by-dataset-id tenant-conn {:id id})]
    (merge (->> {:column-name column-name :table-name (:table-name dataset)}
                (db.dataset/count-num-vals-by-column-name tenant-conn))
           (->> {:column-name column-name :table-name (:table-name dataset)}
                (db.dataset/count-unique-vals-by-colum-name tenant-conn)))))

(defn delete
  [tenant-conn id]
  (if-let [dataset (db.dataset/dataset-by-id tenant-conn {:id id})]
    (if-let [datasets-merged-with (transformation.merge-datasets/datasets-related tenant-conn id)]
      (lib/conflict {:error (format "Cannot delete dataset. It is used in merge transformations of dataset: %s"
                                    (str/join ", " (map :title datasets-merged-with)))})
      (let [c (db.dataset/delete-dataset-by-id tenant-conn {:id id})]
        (if (zero? c)
          (do
            (db.job-execution/delete-failed-job-execution-by-id tenant-conn {:id id})
            (lib/not-found {:error "Not found"}))
          (let [v (db.visualisation/delete-maps-by-dataset-id tenant-conn {:id id})](lib/ok {:id id})))))
    (lib/not-found {:error "Not found"})))

(defn update*
  [tenant-conn caddisfly import-config error-tracker dataset-id {:strs [token email]}]
  (if-let [{data-source-spec :spec
            data-source-id   :id} (db.dataset/data-source-by-dataset-id tenant-conn {:dataset-id dataset-id})]
    (if-let [error (transformation.merge-datasets/consistency-error? tenant-conn dataset-id)]
      (lib/conflict error)
      (if-not (= (get-in data-source-spec ["source" "kind"]) "DATA_FILE")
        (update/update-dataset tenant-conn caddisfly import-config error-tracker dataset-id data-source-id
                               (-> data-source-spec
                                   (assoc-in ["source" "token"] token)
                                   (assoc-in ["source" "email"] email)))
        (lib/bad-request {:error "Can't update uploaded dataset"})))
    (lib/not-found {:id dataset-id})))

(defn update-meta
  [tenant-conn id {:strs [name]}]
  (db.dataset/update-dataset-meta tenant-conn {:id id :title name})
  (lib/ok {}))
