(ns akvo.lumen.db.transformation.sort-column
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/sort_column.sql")
