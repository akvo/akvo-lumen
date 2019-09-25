(ns akvo.lumen.db.share
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/share.sql")
