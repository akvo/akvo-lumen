(ns akvo.lumen.db.data-source
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/data-source.sql")
