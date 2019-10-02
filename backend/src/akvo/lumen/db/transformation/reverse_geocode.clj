(ns akvo.lumen.db.transformation.reverse-geocode
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/reverse_geocode.sql")
