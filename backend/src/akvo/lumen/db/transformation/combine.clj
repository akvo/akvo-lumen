(ns akvo.lumen.db.transformation.combine
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/combine.sql")
