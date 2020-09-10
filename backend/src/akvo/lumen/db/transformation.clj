(ns akvo.lumen.db.transformation
  (:require [akvo.lumen.db.dataset-version :as dv]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn latest-dataset-version-by-dataset-id [conn opts]
  (db-latest-dataset-version-by-dataset-id conn (merge dv/defaults opts)))

(defn latest-dataset-versions [conn]
  (db-latest-dataset-versions conn dv/defaults))

(defn latest-dataset-versions-by-dataset-ids [conn opts]
  (db-latest-dataset-versions-by-dataset-ids conn (merge dv/defaults opts)))

;; todo to change on update RQG change
(defn initial-dataset-version-to-update-by-dataset-id [conn opts]
  (db-initial-dataset-version-to-update-by-dataset-id conn (merge dv/defaults opts)))

(defn initial-dataset-version-version-by-dataset-id [conn opts]
  (db-initial-dataset-version-version-by-dataset-id conn (merge dv/defaults opts)))

(defn n-initial-dataset-version-to-update-by-dataset-id [conn opts]
  (db-n-initial-dataset-version-to-update-by-dataset-id conn (merge dv/defaults opts)))

(defn dataset-versions-by-dataset-id-and-version [conn opts]
  (db-dataset-versions-by-dataset-id-and-version conn (merge dv/defaults opts)))

