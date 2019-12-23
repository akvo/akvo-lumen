(ns akvo.lumen.db.raster
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/raster.sql")
