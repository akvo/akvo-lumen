(ns akvo.lumen.db.dataset
  (:require [akvo.lumen.db.dataset-version :as dv]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn all-datasets [conn]
  (db-all-datasets conn dv/defaults))

(defn dataset-by-id [conn opts]
  (db-dataset-by-id conn (merge dv/defaults opts)))

(defn table-name-and-columns-by-dataset-id [conn opts]
  (db-table-name-and-columns-by-dataset-id conn (merge dv/defaults opts)))

(defn table-name-by-dataset-id [conn opts]
  (db-table-name-by-dataset-id conn (merge dv/defaults opts)))

(defn imported-dataset-columns-by-dataset-id [conn opts]
  (db-imported-dataset-columns-by-dataset-id conn (merge dv/defaults opts)))

(defn data-source-by-dataset-id [conn opts]
  (db-data-source-by-dataset-id conn (merge dv/defaults opts)))
