(ns akvo.lumen.db.env
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/env.sql")
