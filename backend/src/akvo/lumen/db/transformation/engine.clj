(ns akvo.lumen.db.transformation.engine
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/engine.sql")
