(ns akvo.lumen.dataset
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.import :as import]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.update :as update]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.set :refer (rename-keys) :as set]
            [clojure.walk :refer (keywordize-keys)]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")
(hugsql/def-db-fns "akvo/lumen/job-execution.sql")

(defn all
  [tenant-conn]
  (lib/ok (all-datasets tenant-conn)))

(defn create
  [tenant-conn config error-tracker claims data-source]
  (import/handle-import-request tenant-conn config error-tracker claims data-source))

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
  [conn id]
  (if-let [dataset (dataset-by-id conn {:id id})]
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
  [conn id]
  (if-let [dataset (dataset-by-id conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))
          data (rest (jdbc/query conn
                                 [(select-data-sql (:table-name dataset) columns)]
                                 {:as-arrays? true}))]
      (lib/ok
       (-> dataset
           (select-keys [:created :id :modified :status :title :transformations :updated :author :source])
           (rename-keys {:title :name})
           (assoc :rows data :columns columns :status "OK"))))
    (lib/not-found {:error "Not found"})))

(defn- dataset-merged-sources [tenant-conn dataset-id]
  (->> {:dataset-id dataset-id}
       (update/latest-dataset-version-by-dataset-id tenant-conn)
       :transformations
       keywordize-keys
       (filter #(= "core/merge-datasets" (:op %)))
       (map #(-> % :args :source))))

(defn- problematic-merged-datasets? [tenant-conn dataset-merged-sources]
  (let [datasets-merged (mapv :datasetId dataset-merged-sources)]
    (if (empty? datasets-merged)
      nil
      (let [diff (set/difference (set datasets-merged)
                                 (set (map :id (select-datasets-by-id tenant-conn {:ids datasets-merged}))))]
        (when (not-empty diff)
          {:diff diff})))))

(defn problematic-merged-columns? [dss  merge-source-op]
 (let [ds      (some #(when (= (:dataset-id %) (:datasetId merge-source-op)) %) dss)
       columns (set (conj (:mergeColumns merge-source-op)
                          (:mergeColumn merge-source-op)
                          (:aggregationColumn merge-source-op)))]
   (= (set (map #(get % "columnName") (:columns ds)))
      columns)))

(defn delete
  [tenant-conn id]
  (let [c (delete-dataset-by-id tenant-conn {:id id})]
    (if (zero? c)
      (do
        (delete-failed-job-execution-by-id tenant-conn {:id id})
        (lib/not-found {:error "Not found"}))
      (let [v (delete-maps-by-dataset-id tenant-conn {:id id})](lib/ok {:id id})))))

(defn update
  [tenant-conn config dataset-id {refresh-token "refreshToken"}]
  (let [merged-sources (dataset-merged-sources tenant-conn dataset-id)]
    (if-let [merged-problems (problematic-merged-datasets? tenant-conn merged-sources)]
      (lib/bad-request  {:error "This dataset can't be updated thus it has dependent datasets that were removed"
                         :merged-problems merged-problems})
      (if-let [column-problem (when (not-empty merged-sources)
                                (let [dss (->> {:dataset-ids (mapv :datasetId merged-sources)}
                                               (update/latest-dataset-versions-by-dataset-ids tenant-conn )
                                               (map #(rename-keys % {:dataset_id :dataset-id})))]
                                  (some #(when-not (problematic-merged-columns? dss %) %) merged-sources)))]
        (lib/bad-request  {:error "This dataset can't be updated thus it has dependent columns that were removed"
                           :merged-problems column-problem})

        (if-let [{data-source-spec :spec
                  data-source-id   :id} (data-source-by-dataset-id tenant-conn {:dataset-id dataset-id})]
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
          (lib/not-found {:id dataset-id}))))))

(defn update-meta
  [tenant-conn id {:strs [name]}]
  (update-dataset-meta tenant-conn {:id id :title name})
  (lib/ok {}))
