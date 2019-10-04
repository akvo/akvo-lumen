(ns akvo.lumen.db.transformation.geo
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/geo.sql")
