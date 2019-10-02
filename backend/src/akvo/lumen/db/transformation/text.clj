(ns akvo.lumen.db.transformation.text
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/text.sql")
