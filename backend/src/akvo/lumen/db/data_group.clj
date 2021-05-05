(ns akvo.lumen.db.data-group
  (:require [hugsql.core :as hugsql]
            [clojure.tools.logging :as log]))

(hugsql/def-db-fns "akvo/lumen/lib/data_group.sql")

(defn new-data-group [conn opts]
  (db-new-data-group conn opts))

(defn list-data-groups-by-dataset-version-id [conn opts]
  (db-list-data-groups-by-dataset-version-id conn opts))

(defn get-data-group-by-column-name [conn opts]
  (let [column-name-filter [{:columnName (:column-name opts)}]]
    (db-get-data-group-by-column-name conn (assoc opts :column-name-filter column-name-filter))))

(defn get-all-columns-except-group-id [conn opts]
  (vec (flatten (:columns (db-get-all-columns-except-group-id conn opts)))))

(defn get-all-columns [conn opts]
  (vec (flatten (:columns (db-get-all-columns conn opts)))))

(defn exists-view? [conn table-name]
  (:exists (db-exists-view conn {:table-name table-name})))
