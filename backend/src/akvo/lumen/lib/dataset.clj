(ns akvo.lumen.lib.dataset
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation.merge-datasets :as transformation.merge-datasets]
            [akvo.lumen.lib.update :as update]
            [akvo.lumen.component.flow :as c.flow]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.set :refer (rename-keys)]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(defn all
  [tenant-conn flow-api]
  (let [dss (all-datasets tenant-conn)]
    (log/error (doall (->>
                       dss
                       (map :source)
                       (map
                        (fn [ds]
                          (let [instance (get ds "instance")
                                survey (get ds "surveyId")]
                            [instance survey
                             (try 
                               (when-let [rt (str/replace (get ds "refreshToken") #" " "")]
                                 (:body
                                  (c.flow/check-permissions flow-api rt
                                                            [{:instance_id (if (= "uat1" instance)
                                                                             (str "akvoflow-" instance)
                                                                             instance)
                                                              :survey_id survey}])))

                               (catch Exception e (log/error :fail [instance survey] (.getMessage e))))]))))))


    (lib/ok dss)))

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

(defn delete
  [tenant-conn id]
  (if-let [datasets-merged-with (transformation.merge-datasets/datasets-related tenant-conn id)]
    (lib/conflict {:error (format "This dataset is used in merge tranformations with other datasets: %s"
                                  (str/join ", " datasets-merged-with))})
    (let [c (delete-dataset-by-id tenant-conn {:id id})]
      (if (zero? c)
        (do
          (delete-failed-job-execution-by-id tenant-conn {:id id})
          (lib/not-found {:error "Not found"}))
        (let [v (delete-maps-by-dataset-id tenant-conn {:id id})](lib/ok {:id id}))))))

(defn update
  [tenant-conn import-config error-tracker dataset-id {refresh-token "refreshToken"}]
  (if-let [{data-source-spec :spec
            data-source-id   :id} (data-source-by-dataset-id tenant-conn {:dataset-id dataset-id})]
    (if-let [error (transformation.merge-datasets/consistency-error? tenant-conn dataset-id)]
      (lib/conflict error)
      (if-not (= (get-in data-source-spec ["source" "kind"]) "DATA_FILE")
        (update/update-dataset tenant-conn import-config error-tracker dataset-id data-source-id
                               (assoc-in data-source-spec ["source" "refreshToken"] refresh-token))
        (lib/bad-request {:error "Can't update uploaded dataset"})))
    (lib/not-found {:id dataset-id})))

(defn update-meta
  [tenant-conn id {:strs [name]}]
  (update-dataset-meta tenant-conn {:id id :title name})
  (lib/ok {}))
