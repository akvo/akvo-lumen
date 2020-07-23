(ns akvo.lumen.db.dataset
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")


(defn all-datasets [conn]
  (db-all-datasets conn {:ns "main"}))
