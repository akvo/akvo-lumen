(ns akvo.lumen.db.dataset-version
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset_version.sql")
