(ns akvo.lumen.db.dataset
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(def defaults {:ns "main"})

(defn all-datasets [conn]
  (db-all-datasets conn defaults))

(defn dataset-by-id [conn opts]
  (db-dataset-by-id conn (merge defaults opts)))

(defn table-name-and-columns-by-dataset-id [conn opts]
  (db-table-name-and-columns-by-dataset-id conn (merge defaults opts)))

(defn table-name-by-dataset-id [conn opts]
  (db-table-name-by-dataset-id conn (merge defaults opts))
  )
