(ns akvo.lumen.db.transformation.change-datatype
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/change_datatype.sql")
