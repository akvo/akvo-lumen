(ns akvo.lumen.db.dataset-version
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset_version.sql")

(def defaults {:namespace "main"})

(defn new-dataset-version [conn opts]
  (db-new-dataset-version conn (merge defaults opts)))
