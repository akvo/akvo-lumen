(ns akvo.lumen.db.resource
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/resource.sql")
