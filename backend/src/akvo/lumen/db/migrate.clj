(ns akvo.lumen.db.migrate
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/migrate.sql")
