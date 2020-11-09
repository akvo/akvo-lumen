(ns akvo.lumen.db.data-group
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/data_group.sql")

(defn new-data-group [conn opts]
  (db-new-data-group conn opts))

(defn list-data-groups-by-dataset-version-id [conn opts]
  (db-list-data-groups-by-dataset-version-id conn opts))

(defn get-data-group-by-column-name [conn opts]
  (let [column-name-filter [{:columnName (:column-name opts)}]]
    (db-get-data-group-by-column-name conn (assoc opts :column-name-filter column-name-filter))))

(defn update-reference-non-modified-groups [conn opts]
  (db-update-reference-unmodified-groups conn opts))

(comment
  (hugsql/def-sqlvec-fns "akvo/lumen/lib/data_group.sql")
  (db-get-data-group-by-column-name-sqlvec {:column-name-filter [{:columnName "c1"}] :dataset-version-id "5fa91705-5266-4882-8877-33af91201138"})
  (db-get-data-group-by-column-name (dev/db-conn) {:column-name-filter [{:columnName "c100"}] :dataset-version-id "5fa91705-5266-4882-8877-33af91201138"})
  )
