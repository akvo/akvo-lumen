(ns akvo.lumen.db.dashboard
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")
