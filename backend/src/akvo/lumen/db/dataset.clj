(ns akvo.lumen.db.dataset
  (:require [akvo.lumen.db.dataset-version :as dv]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [akvo.lumen.lib.transformation.engine :as tx.engine]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn all-datasets [conn]
  (db-all-datasets conn dv/defaults))

(defn dataset-by-id [conn opts]
  (db-dataset-by-id conn (merge dv/defaults opts)))

(defn n-dataset-by-id [conn opts]
  (db-n-dataset-by-id conn (merge dv/defaults opts)))

(defn adapt-group [c]
  (let [[groupId groupName] (cond
                              (some? (get c "groupId")) [(get c "groupId") (get c "groupName")]
                              (contains? flow-common/metadata-keys (get c "columnName")) ["metadata" "metadata"]
                              (tx.engine/is-derived? (get c "columnName")) ["transformations" "transformations"]
                              :else ["main" "main"])]

    (-> c
        (assoc "groupId" groupId)
        (assoc "groupName" groupName))))

(defn n-table-name-and-columns-by-dataset-id [conn opts]
  (db-n-table-name-and-columns-by-dataset-id conn (merge dv/defaults opts)))

(defn table-name-and-columns-by-dataset-id [conn opts]
  (db-table-name-and-columns-by-dataset-id conn (merge dv/defaults opts)))

(defn table-name-by-dataset-id [conn opts]
  (db-table-name-by-dataset-id conn (merge dv/defaults opts)))

(defn imported-dataset-columns-by-dataset-id [conn opts]
  (db-imported-dataset-columns-by-dataset-id conn (merge dv/defaults opts)))

(defn data-source-by-dataset-id [conn opts]
  (db-data-source-by-dataset-id conn (merge dv/defaults opts)))
