(ns akvo.lumen.db.visualisation
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")
