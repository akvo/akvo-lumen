(ns akvo.lumen.lib.collection
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.lib :as lib]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.dashboard :as l.dashboard]
            [akvo.lumen.lib.visualisation :as l.visualisation]
            [clojure.set :as set]
            [cheshire.core :as json]
            [cheshire.generate :refer [add-encoder]]
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
    (->> (.getArray (:entities collection))
         (mapv (fn [e] (new-entity (str/split e #"::"))) )
         (core/assoc collection :entities))))

(defn authenticate-fn [tenant-conn auth-datasets]
  (letfn [(auth-fun [e]
            (let [res (condp = (:type e)
                        :dashboard-id (l.dashboard/auth-fetch tenant-conn (:uuid e) auth-datasets)
                        :visualisation-id (l.visualisation/fetch tenant-conn (:uuid e) auth-datasets)
                        :raster-dataset-id (lib/ok e)
                        :dataset-id (if (contains? (set auth-datasets) (:uuid e))
                                      (lib/ok e)
                                      (lib/not-authorized e)))]
              (log/debug :auth-e e (first res))
              (= :akvo.lumen.lib/ok (first res))))]
    (fn [collection]
      (let [res (every? auth-fun (:entities collection))]
        (log/error "auth-e?" (:title collection) res)
        res))))

(defn all
  "collection.entities as a result of executing sql have the following pattern 'UUID::entity-type'
  entity-types could be: visualisation-id, dashboard-id, raster-dataset-id and dataset-id"
  [tenant-conn auth-datasets]
  (let [auth? (authenticate-fn tenant-conn auth-datasets)
        all* (mapv feed-entities (all-collections tenant-conn {}))]    
    (lib/ok (filter auth? all*))))

(defn fetch [tenant-conn id auth-datasets]
  (if-let [collection (feed-entities (fetch-collection tenant-conn {:id id}))]
    (if ((authenticate-fn tenant-conn auth-datasets) collection)
      (lib/ok collection)
      (lib/not-authorized nil))
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

(defn create [tenant-conn {:strs [title entities]} auth-datasets]
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
          (lib/created (second (fetch tx-conn id auth-datasets))))
        (catch SQLException e
          (if (unique-violation? e)
            (lib/conflict {:title title
                           :error "Collection title already exists"})
            (throw e)))))))

(defn update
  "Update a collection. Updates the title and all the entities"
  [tenant-conn id collection auth-datasets]
  (let [{:strs [entities title]} collection]
    (jdbc/with-db-transaction [tx-conn tenant-conn]
      (when title
        (update-collection-title tx-conn {:id id :title title}))

      ;; Replace entity ids
      (when entities
        (delete-collection-entities tx-conn {:id id})
        (doseq [entity (categorize-entities tx-conn entities)]
          (insert-collection-entity tx-conn (assoc entity :collection-id id))))

      (fetch tx-conn id auth-datasets))))

(defn delete
  "Delete a collection by id"
  [tenant-conn id auth-datasets]
  (if-let [collection (feed-entities (fetch-collection tenant-conn {:id id}))]
    (if ((authenticate-fn tenant-conn auth-datasets) collection)
      (do
        (delete-collection tenant-conn {:id id})
        (lib/no-content))
      (lib/not-authorized nil))
    (lib/not-found {:id id})))
