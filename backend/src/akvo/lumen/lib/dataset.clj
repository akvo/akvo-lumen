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

(defn select-data-sql
  "first table name is main namespace table"
  [table-names columns]
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
                        (conj cols (format "%s.rnum" (first table-names)))
                        (str/join ", " cols))]
    (format "SELECT %s FROM %s ORDER BY %s"
            select-expr
            (if (= 1 (count table-names))
              (first table-names)
              (dutils/from-clause table-names))
            order-by-expr)))

(defn- groups [dsvs]
  (let [dataset-columns (->> dsvs
                             (map :columns)
                             (reduce into [])
                             (map db.dataset/adapt-group))]
    (-> (group-by #(get % "groupId") dataset-columns)
        (update "transformations" vec))))

(defn fetch-metadata
  "Fetch dataset metadata (everything apart from rows)"
  [tenant-conn id]
  (if-let [dsvs (seq (db.dataset/n-dataset-by-id tenant-conn {:id id}))]
    (let [groups   (groups dsvs)
          dataset* (-> (select-keys (first dsvs)
                                    [:created :id :modified :status :title :transformations :updated :author :source :columns])
                       (assoc :status "OK")
                       (assoc :columns (reduce into [] (vals groups)))
                       (rename-keys {:title :name}))]
      (lib/ok dataset*))
    (lib/not-found {:error "Not found"})))

(defn fetch-groups-metadata
  "Fetch dataset groups metadata (everything apart from rows)

  if dataset is CSV type then will contain a 'main' group containing all csv columns
  else if FLOW type we'll return the columns inside each flow group besides a 'metadata' group

  always we'll use 'transformations' groupId to include all generated transformations"
  [tenant-conn id]
  (if-let [dsvs (seq (db.dataset/n-dataset-by-id tenant-conn {:id id}))]
    (let [dataset* (-> (select-keys (first dsvs)
                                    [:id :title :modified :created :updated :source])
                       (assoc :status "OK"
                              :transformations (tx.engine/unify-transformation-history dsvs))
                       (rename-keys {:title :name}))]
      (lib/ok (assoc dataset*  :groups (groups dsvs))))
   (lib/not-found {:error "Not found"})))

(defn fetch
  [tenant-conn id]
  (when-let [dsvs (seq (db.dataset/n-dataset-by-id tenant-conn {:id id}))]
    (let [groups-dataset (groups dsvs)
          columns (reduce into [] (vals groups-dataset))
          namespaces (set (map #(get % "namespace" "main") columns))
          columns (remove #(get % "hidden")  columns)
          table-names (map :table-name (filter #(contains? namespaces (:namespace %)) dsvs))
          q (select-data-sql (reverse (sort table-names)) columns)
          data (rest (jdbc/query tenant-conn
                                 [q]
                                 {:as-arrays? true}))]
      (-> (select-keys (first dsvs) [:created :id :modified :status :title :updated :author :source ])

          remove-token
          (assoc :rows data
                 :transformations (tx.engine/unify-transformation-history dsvs)
                 :columns columns
                 :status "OK")
          (rename-keys {:title :name})
          ))))

(defn fetch-group
  [tenant-conn id group-id]
  (when-let [dsvs (seq (db.dataset/n-dataset-by-id tenant-conn {:id id}))]
    (let [group-dataset (get (groups dsvs) group-id)
          namespaces (set (map #(get % "namespace" "main") group-dataset))
          columns (remove #(get % "hidden")  group-dataset)
          table-names (map :table-name (filter #(contains? namespaces (:namespace %)) dsvs))
          q (select-data-sql (reverse (sort table-names)) columns)
          data (rest (jdbc/query tenant-conn
                                 [q]
                                 {:as-arrays? true}))]
      (-> (select-keys (first dsvs) [:updated :created :modified])
          remove-token
          (assoc :rows data
                 :columns columns
                 :status "OK" :datasetId (:id (first dsvs)) :groupId group-id)))))

(defn sort-text
  [tenant-conn id column-name limit order]
  (when-let [dataset (first (filter (fn [{:keys [table-name columns]}]
                                      (not-empty (filter #(= column-name (get % "columnName")) columns)))
                                    (db.dataset/n-table-name-and-columns-by-dataset-id tenant-conn {:id id})))]
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
  (if-let [dataset (db.dataset/n-dataset-by-id tenant-conn {:id id})]
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
