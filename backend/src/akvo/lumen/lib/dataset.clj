(ns akvo.lumen.lib.dataset
  (:require [akvo.lumen.lib.aggregation.commons :as acommons]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.visualisation :as db.visualisation]
            [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset.utils :as dutils]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.lib.import.csv :as i.csv]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [akvo.lumen.lib.transformation.engine :as tx.engine]
            [akvo.lumen.lib.transformation.merge-datasets :as transformation.merge-datasets]
            [akvo.lumen.lib.update :as update]
            [akvo.lumen.protocols :as p]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :refer (rename-keys)]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]))

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
  (if-let [dataset (db.dataset/dataset-in-groups-by-id tenant-conn {:id id})]
    (lib/ok (->
             (reduce
              (fn [d [group-id group]]
                (let [columns (remove #(get % "hidden") (:columns group))]
                  (-> d
                      (update :columns #(apply conj % columns))
                      (assoc :status "OK"))))
              (assoc dataset :columns [])
              (:groups dataset))
             remove-token
             (select-keys [:created :id :modified :status :title :transformations :updated :author :source :columns])
             (rename-keys {:title :name})))
    (lib/not-found {:error "Not found"})))

(defn fetch-groups-metadata
  "Fetch dataset groups metadata (everything apart from rows)

  if dataset is CSV type then will contain a 'main' group containing all csv columns
  else if FLOW type we'll return the columns inside each flow group besides a 'metadata' group

  always we'll use 'transformations' groupId to include all generated transformations"
  [tenant-conn id]
  (if-let [dsvs (seq (db.dataset/dataset-by-id tenant-conn {:id id}))]
    (let [dataset* (-> (select-keys (first dsvs)
                                    [:id :title :modified :created :updated :source])
                       (assoc :status "OK"
                              :transformations (tx.engine/unify-transformation-history dsvs))
                       (rename-keys {:title :name}))
          dataset-columns (->> dsvs
                               (map :columns)
                               (reduce into [])
                               (map db.dataset/adapt-group))
          groups (group-by #(get % "groupId") dataset-columns)]
      (lib/ok (assoc dataset*  :groups groups)))
   (lib/not-found {:error "Not found"})))

(defn fetch
  [tenant-conn id]
  (when-let [dataset (db.dataset/dataset-in-groups-by-id tenant-conn {:id id})]
    (->
     (reduce
      (fn [d [group-id group]]
        (let [columns (remove #(get % "hidden") (:columns group))
              data (rest (jdbc/query tenant-conn
                                     [(select-data-sql (:table-name group) columns)]
                                     {:as-arrays? true}))]
          (-> d 
              (update :rows (fn [rows] ;; naive impl expecting to have same rows in each group
                              (if (seq rows)
                                (map into rows data)                                
                                (apply conj rows data))))
              (update :columns #(apply conj % columns))
              (assoc :status "OK"))))
      (assoc dataset :rows [] :columns [])
      (:groups dataset))
     remove-token
     (select-keys [:created :id :modified :status :title :transformations :updated :author :source :rows :columns])
     (rename-keys {:title :name}))))

(defn fetch-group
  [tenant-conn id group-id]
  (when-let [dataset (db.dataset/dataset-in-groups-by-id tenant-conn {:id id})]
    (let [group-dataset (get (:groups dataset) (if (= "main" group-id) nil group-id))
          column-remove-condition (condp = group-id
                                    "metadata" #(not (contains? flow-common/metadata-keys (get % "columnName")))
                                    "transformations" #(not (tx.engine/is-derived? (get % "columnName")))
                                    "main" #(not (i.csv/valid-column-name? (get % "columnName")))
                                    #(not (= group-id (get % "groupId"))))
          columns (remove #(or (get % "hidden") (column-remove-condition %)) (:columns group-dataset))
          data (rest (jdbc/query tenant-conn
                                 [(select-data-sql (:table-name group-dataset) columns)]
                                 {:as-arrays? true}))]
      (-> (select-keys dsv [:updated :created :modified :transformations])
          remove-token
          (assoc :rows data
                 :columns group-dataset
                 :status "OK" :datasetId (:id dsv) :groupId group-id)))))

(defn sort-text
  [tenant-conn id column-name limit order]
  (when-let [dataset (first (filter (fn [{:keys [table-name columns]}]
                                      (not-empty (filter #(= column-name (get % "columnName")) columns)))
                                    (db.dataset/table-name-and-columns-by-dataset-id tenant-conn {:id id})))]
    (let [column (dutils/find-column (w/keywordize-keys (:columns dataset)) column-name)]
      (let [result (->> (merge {:column-name (acommons/sql-option-bucket-column column) :table-name (:table-name dataset)}
                               (when limit {:limit limit}))
                        (db.dataset/count-vals-by-column-name tenant-conn)
                        (map (juxt :counter :coincidence)))]
        (cond->> result
          (= "value" order) (sort-by second))))))

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
