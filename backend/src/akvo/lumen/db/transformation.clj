(ns akvo.lumen.db.transformation
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")
