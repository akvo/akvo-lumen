(ns akvo.lumen.db.public
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/public.sql")
