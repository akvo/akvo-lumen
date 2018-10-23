(ns akvo.lumen.transformation.delete-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [akvo.lumen.transformation.merge-datasets :refer (datasets-merged-with*)]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defmethod engine/valid? :core/delete-column
  [op-spec]
  (engine/valid-column-name? (col-name op-spec)))

(defmethod engine/extend-data-command :core/delete-column
  [{:keys [tenant-conn] :as deps} dataset-id command]
  (assoc (:transformation command) :datasets-merged-with (datasets-merged-with* tenant-conn dataset-id)))


(defmethod engine/apply-operation :core/delete-column
  [{:keys [tenant-conn]} table-name columns op-spec]
  (log/error ::delete-column op-spec)
  (let [column-name (col-name op-spec)
          column-idx (engine/column-index columns column-name)]
      (delete-column tenant-conn {:table-name table-name :column-name column-name})
      {:success? true
       :execution-log [(format "Deleted column %s" column-name)]
       :columns (into (vec (take column-idx columns))
                      (drop (inc column-idx) columns))}))
