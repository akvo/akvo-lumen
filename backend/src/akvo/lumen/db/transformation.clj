(ns akvo.lumen.db.transformation
  (:require [akvo.lumen.db.dataset-version :as dv]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn latest-dataset-version-by-dataset-id [conn opts]
  (db-latest-dataset-version-by-dataset-id conn (merge dv/defaults opts)))

(defn latest-dataset-version-2-by-dataset-id [conn opts]
  (db-latest-dataset-version-2-by-dataset-id conn (merge dv/defaults opts)))

(defn latest-dataset-versions [conn]
  (db-latest-dataset-versions conn dv/defaults))

(defn latest-dataset-versions-by-dataset-ids [conn opts]
  (db-latest-dataset-versions-by-dataset-ids conn (merge dv/defaults opts)))

(defn latest-dataset-versions-2-by-dataset-ids [conn opts]
  (db-latest-dataset-versions-2-by-dataset-ids conn opts))

(defn update-dataset-version [conn opts]
  (db-update-dataset-version conn (merge dv/defaults opts)))

(defn initial-dataset-version-to-update-by-dataset-id [conn opts]
  (db-initial-dataset-version-to-update-by-dataset-id conn (merge dv/defaults opts)))

(defn initial-dataset-version-2-to-update-by-dataset-id [conn opts]
  (db-initial-dataset-version-2-to-update-by-dataset-id conn (merge dv/defaults opts)))


(defn dataset-version-by-dataset-id [conn opts]
  (db-dataset-version-by-dataset-id conn (merge dv/defaults opts)))

(defn clear-dataset-version-data-table [conn opts]
  (db-clear-dataset-version-data-table conn opts))

(defn clear-data-group-data-table [conn opts]
  (db-clear-data-group-data-table conn opts))
