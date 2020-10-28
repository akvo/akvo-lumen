(ns akvo.lumen.db.data-group
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/data_group.sql")

(defn new-data-group [conn opts]
  (db-new-data-group conn opts))

(defn list-data-groups-by-dataset-version-id [conn opts]
  (db-list-data-groups-by-dataset-version-id conn opts))
