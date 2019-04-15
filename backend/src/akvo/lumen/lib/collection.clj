(ns akvo.lumen.lib.collection
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.lib :as lib]
            [cheshire.generate :refer [add-encoder]]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as str]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException Connection]))

(alias 'core 'clojure.core)

(hugsql/def-db-fns "akvo/lumen/lib/collection.sql")

(defrecord Entity [uuid type])

(defn new-entity [[uuid type]]
  (Entity. uuid (keyword type)))

(add-encoder akvo.lumen.lib.collection.Entity
             (fn [entity jsonGenerator]
               (.writeString jsonGenerator (:uuid entity))))

(defn feed-entities [collection]
  (when collection
    (let [model (->> (.getArray (:entities collection))
                     (mapv (fn [e] (new-entity (str/split e #"::")))))
          collection (core/assoc collection :entities model)
          data (reduce (fn [m e]
                         (condp = (:type e)
                           :raster-dataset-id (core/update m :rasters #(conj % e))
                           :dataset-id (core/update m :datasets #(conj % e))
                           :visualisation-id (core/update m :visualisations #(conj % e))
                           :dashboard-id (core/update m :dashboards #(conj % e))))
                       {:dashboards []
                        :datasets []
                        :rasters []
                        :visualisations []} model)]
      (merge collection data))))

(defn all
  ([tenant-conn]
   (all tenant-conn nil))
  ([tenant-conn ids]
   (mapv feed-entities (all-collections tenant-conn (if ids {:ids ids} {})))))

(defn fetch [tenant-conn id]
  (if-let [collection (feed-entities (fetch-collection tenant-conn {:id id}))]
    (lib/ok collection)
    (lib/not-found {:id id})))

(defn- text-array
  "Creates the sql type text[] from a collection of strings"
  [^Connection conn coll]
  (with-open [conn (.getConnection (:datasource conn))]
    (.createArrayOf conn "text" (into-array String coll))))

(defn- categorize-entities
  "Categorize the entity ids into maps of the form

   {:dataset-id
    :visualisation-id
    :dashboard-id
    :raster-dataset-id}

   where only one of the individual map ids will be non-nil"
  [conn entities]
  (let [entity-array (text-array conn entities)]
    (->> (concat
           (fetch-dataset-ids conn {:ids entity-array})
           (fetch-visualisation-ids conn {:ids entity-array})
           (fetch-dashboard-ids conn {:ids entity-array})
           (fetch-raster-dataset-ids conn {:ids entity-array}))
      (map #(merge {:dataset-id nil :visualisation-id nil :dashboard-id nil
                    :raster-dataset-id nil} %)))))

(defn unique-violation? [^SQLException e]
  (= (.getSQLState e) "23505"))

(defn create [tenant-conn {:strs [title entities]}]
  (cond
    (empty? title) (lib/bad-request {:error "Title is missing"})
    (> (count title) 128) (lib/bad-request {:error "Title is too long"
                                            :title title})
    :else
    (jdbc/with-db-transaction [tx-conn tenant-conn]
      (try
        (let [{:keys [id]} (create-collection tenant-conn {:title title})]
          (when entities
            (doseq [entity (categorize-entities tx-conn entities)]
              (insert-collection-entity tx-conn (assoc entity :collection-id id))))
          (lib/created (second (fetch tx-conn id))))
        (catch SQLException e
          (if (unique-violation? e)
            (lib/conflict {:title title
                           :error "Collection title already exists"})
            (throw e)))))))

(defn update
  "Update a collection. Updates the title and all the entities"
  [tenant-conn id collection]
  (let [{:strs [entities title]} collection]
    (jdbc/with-db-transaction [tx-conn tenant-conn]
      (when title
        (update-collection-title tx-conn {:id id :title title}))

      ;; Replace entity ids
      (when entities
        (delete-collection-entities tx-conn {:id id})
        (doseq [entity (categorize-entities tx-conn entities)]
          (insert-collection-entity tx-conn (assoc entity :collection-id id))))

      (fetch tx-conn id))))

(defn delete
  "Delete a collection by id"
  [tenant-conn id]
  (delete-collection tenant-conn {:id id})
  (lib/no-content))
