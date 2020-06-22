(ns akvo.lumen.db.dataset
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn dataset-by-id [conn opts]
  (first (dataset-by-id* conn opts)))
