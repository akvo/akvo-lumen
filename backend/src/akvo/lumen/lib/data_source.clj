(ns akvo.lumen.lib.data-source
  (:require [akvo.lumen.lib :as lib]
            [clojure.string :as str]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/data-source.sql")

(defn delete [conn id status]
  {:pre [(#{:pending :failed :ok} (keyword status))]}
  (delete-datasource-by-job-execution-id-and-status conn {:id id :status (str/upper-case status)})
  (lib/ok {}))


