(ns akvo.lumen.db.user
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/user.sql")
