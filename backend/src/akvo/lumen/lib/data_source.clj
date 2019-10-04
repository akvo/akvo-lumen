(ns akvo.lumen.lib.data-source
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.db.data-source :as db.data-source]
            [clojure.string :as str]))

(defn delete [conn id status]
  {:pre [(#{:pending :failed :ok} (keyword status))]}
  (db.data-source/delete-datasource-by-job-execution-id-and-status conn {:id id :status (str/upper-case status)})
  (lib/ok {}))


