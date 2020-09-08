(ns akvo.lumen.db.dataset-version
  (:require [hugsql.core :as hugsql]
            [cheshire.generate :as ches.generate])
  (:import [java.time Instant]))

(ches.generate/add-encoder Instant (fn [obj jsonGenerator] (.writeString jsonGenerator (str obj))))

(hugsql/def-db-fns "akvo/lumen/lib/dataset_version.sql")

(def defaults {:namespace "main"})

(defn new-dataset-version [conn opts]
  (db-new-dataset-version conn (merge defaults opts)))
