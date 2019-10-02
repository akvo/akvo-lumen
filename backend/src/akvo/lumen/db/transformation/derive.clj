(ns akvo.lumen.db.transformation.derive
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/derive.sql")
