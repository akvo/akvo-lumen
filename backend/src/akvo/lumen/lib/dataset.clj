(ns akvo.lumen.lib.dataset
  (:require [akvo.lumen.lib.aggregation.commons :as acommons]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.visualisation :as db.visualisation]
            [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.env :as env]
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



(defn- groups
  ([dataset]
   (groups dataset false))
  ([dataset ordered?]
   (let [dataset-columns (->> (:columns dataset)
                              (remove #(get % "hidden"))
                              (map db.dataset/adapt-group))
         grouped (-> (group-by #(get % "groupId") dataset-columns)
                     (update "transformations" vec))]
     (if ordered?
       (let [ordered (distinct (map #(get % "groupId") dataset-columns))
             res (reduce #(conj % [%2 (get grouped %2)]) [] ordered)]
         (if (contains? (set ordered) "transformations")
           res
           (conj res ["transformations" []]) ))
       grouped))))

(defn fetch-groups-metadata
  "Fetch dataset groups metadata (everything apart from rows)

  if dataset is CSV type then will contain a 'main' group containing all csv columns
  else if FLOW type we'll return the columns inside each flow group besides a 'metadata' group

  always we'll use 'transformations' groupId to include all generated transformations"
  [tenant-conn id]
  (if (get (env/all tenant-conn) "data-groups")
    (if-let [data-groups (seq (db.dataset/data-groups-by-dataset-id tenant-conn {:dataset-id id}))]
      (let [dataset* (-> (select-keys (first data-groups)
                                      [:name :modified :created :updated :source :transformations])
                         (assoc :status "OK"))]
        (lib/ok (assoc dataset*  :id id :groups (mapv (juxt :id :columns :repeatable) data-groups))))
      (lib/not-found {:error "Not found"}))
    (if-let [dsv (db.dataset/dataset-by-id tenant-conn {:id id})]
      (let [dataset* (-> (select-keys dsv
                                      [:id :title :modified :created :updated :source :transformations])
                         (assoc :status "OK")
                         (rename-keys {:title :name}))]
        (lib/ok (assoc dataset*  :groups (groups dsv true))))
      (lib/not-found {:error "Not found"}))))

(defn fetch-metadata
  "Fetch dataset metadata (everything apart from rows)"
  [tenant-conn id]
  (if-let [dsv (db.dataset/dataset-by-id tenant-conn {:id id})]
    (let [groups   (groups dsv)
          dataset* (-> (select-keys dsv
                                    [:created :id :modified :status :title :transformations :updated :author :source :columns])
                       (assoc :status "OK")
                       (assoc :columns (reduce into [] (vals groups)))
                       (rename-keys {:title :name}))]
      (lib/ok dataset*))
    (lib/not-found {:error "Not found"})))

(defn fetch
  [tenant-conn id]
  (when-let [dsv (db.dataset/dataset-by-id tenant-conn {:id id})]
    (let [groups-dataset (groups dsv)
          columns (reduce into [] (vals groups-dataset))
          namespaces (set (map #(get % "namespace" "main") columns))
          columns (remove #(get % "hidden")  columns)
          q (select-data-sql (:table-name dsv) columns)
          data (rest (jdbc/query tenant-conn
                                 [q]
                                 {:as-arrays? true}))]
      (-> (select-keys dsv [:created :id :modified :status :title :updated :author :source :transformations])

          remove-token
          (assoc :rows data
                 :columns columns
                 :status "OK")
          (rename-keys {:title :name})))))

(defn fetch-group
  [tenant-conn id group-id]
  (if (get (env/all tenant-conn) "data-groups")
    (when-let [dg (db.dataset/data-group-by-dataset-id-and-group-id tenant-conn {:dataset-id id
                                                                                 :group-id group-id})]
      (let [q (select-data-sql (:table-name dg) (:columns dg))
            data (rest (jdbc/query tenant-conn
                                   [q]
                                   {:as-arrays? true}))]
        (-> (select-keys dg [:updated :created :modified :transformations])
            remove-token
            (assoc :rows data
                   :columns (:columns dg)
                   :status "OK" :datasetId id :groupId group-id))))
    (when-let [dsv (db.dataset/dataset-by-id tenant-conn {:id id})]
      (let [columns (get (groups dsv) group-id)
            namespaces (set (map #(get % "namespace" "main") columns))
            q (select-data-sql (:table-name dsv) columns)
            data (rest (jdbc/query tenant-conn
                                   [q]
                                   {:as-arrays? true}))]
        (-> (select-keys dsv [:updated :created :modified :transformations])
            remove-token
            (assoc :rows data
                   :columns columns
                   :status "OK" :datasetId (:id dsv) :groupId group-id))))))

(defn sort-text
  [tenant-conn id column-name limit order]
  (when-let [dataset (db.dataset/table-name-and-columns-by-dataset-id tenant-conn {:id id})]
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
