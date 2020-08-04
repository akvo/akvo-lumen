(ns akvo.lumen.db.job-execution
  (:require [hugsql.core :as hugsql]
            [akvo.lumen.util :as u]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(defn vacuum-table [conn opts]
  (u/time-with-log
   (str "vacuum-table " (:table-name opts))
   (do
     (vacuum-table* conn opts {} {:transaction? false}))))
