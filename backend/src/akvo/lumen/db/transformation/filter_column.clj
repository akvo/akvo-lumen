(ns akvo.lumen.db.transformation.filter-column
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/filter_column.sql")
