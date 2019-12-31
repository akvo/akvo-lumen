(ns akvo.lumen.lib.collection
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.db.collection :as db.collection]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set])
  (:import [java.sql SQLException Connection]))

(defn all
  ([tenant-conn]
   (all tenant-conn nil))
  ([tenant-conn ids]
   (mapv (fn [collection]
           (update collection :entities #(vec (.getArray %))))
         (db.collection/all-collections tenant-conn (if ids {:ids ids} {})))))

(defn fetch [tenant-conn id]
  (if-let [collection (db.collection/fetch-collection tenant-conn {:id id})]
    (lib/ok (update collection :entities #(vec (.getArray %))))
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
           (db.collection/fetch-dataset-ids conn {:ids entity-array})
           (db.collection/fetch-visualisation-ids conn {:ids entity-array})
           (db.collection/fetch-dashboard-ids conn {:ids entity-array})
           (db.collection/fetch-raster-dataset-ids conn {:ids entity-array}))
      (map #(merge {:dataset-id nil :visualisation-id nil :dashboard-id nil
                    :raster-dataset-id nil} %)))))

(defn unique-violation? [^SQLException e]
  (= (.getSQLState e) "23505"))

(defn create [tenant-conn {:keys [title entities]}]
  (cond
    (empty? title) (lib/bad-request {:error "Title is missing"})
    (> (count title) 128) (lib/bad-request {:error "Title is too long"
                                            :title title})
    :else
    (jdbc/with-db-transaction [tx-conn tenant-conn]
      (try
        (let [{:keys [id]} (db.collection/create-collection tenant-conn {:title title})]
          (when entities
            (doseq [entity (categorize-entities tx-conn entities)]
              (db.collection/insert-collection-entity tx-conn (assoc entity :collection-id id))))
          (lib/created (second (fetch tx-conn id))))
        (catch SQLException e
          (if (unique-violation? e)
            (lib/conflict {:title title
                           :error "Collection title already exists"})
            (throw e)))))))

(defn update*
  "Update a collection. Updates the title and all the entities"
  [tenant-conn id collection]
  (let [{:keys [entities title]} collection]
    (jdbc/with-db-transaction [tx-conn tenant-conn]
      (when title
        (db.collection/update-collection-title tx-conn {:id id :title title}))

      ;; Replace entity ids
      (when entities
        (db.collection/delete-collection-entities tx-conn {:id id})
        (doseq [entity (categorize-entities tx-conn entities)]
          (db.collection/insert-collection-entity tx-conn (assoc entity :collection-id id))))

      (fetch tx-conn id))))

(defn delete
  "Delete a collection by id"
  [tenant-conn id]
  (db.collection/delete-collection tenant-conn {:id id})
  (lib/no-content))
