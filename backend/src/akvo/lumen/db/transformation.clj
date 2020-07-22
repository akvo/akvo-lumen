(ns akvo.lumen.db.transformation
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn latest-dataset-version-by-dataset-id [con opts]
  (let [v (:version (latest-dataset-version-by-dataset-id* con opts))]
    (first (latest-dataset-versions-by-dataset-id con (assoc opts :version v)))))
