(ns akvo.lumen.db.transformation
  (:require [akvo.lumen.db.dataset-version :as dv]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn latest-dataset-version-by-dataset-id [conn opts]
  (db-latest-dataset-version-by-dataset-id conn (merge dv/defaults opts)))

(defn latest-dataset-versions [conn opts]
  (db-latest-dataset-versions conn (merge dv/defaults opts)))

(defn latest-dataset-versions-by-dataset-ids [conn opts]
  (db-latest-dataset-versions-by-dataset-ids conn (merge dv/defaults opts)))

(defn update-dataset-version [conn opts]
  (db-update-dataset-version conn (merge dv/defaults opts)))
