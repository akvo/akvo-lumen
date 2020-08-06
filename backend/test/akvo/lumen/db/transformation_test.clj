(ns akvo.lumen.db.transformation-test
  (:require [akvo.lumen.db.dataset-version :as dv]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation_test.sql")

(defn get-table-name [conn opts]
  (db-get-table-name conn (merge dv/defaults opts)))

