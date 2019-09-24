(ns akvo.lumen.db.collection
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/collection.sql")
