(ns akvo.lumen.transformation.sort-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/sort_column.sql")

(defmethod engine/valid? :core/sort-column
  [{:strs [args] :as op-spec}]
  (boolean (#{"ASC" "DESC"} (get (engine/args op-spec) "sortDirection"))))

(defmethod engine/valid? :core/remove-sort
  [op-spec]
  true)

(defn- get-sort-idx
  "Returns the next sort index for a given vector of columns"
  [columns]
  (inc (count (filter #(get % "sort") columns))))

(defmethod engine/column-metadata-operation :core/sort-column
  [columns op-spec]
  (let [{column-name "columnName"
         sort-direction "sortDirection"} (engine/args op-spec)
        col-idx (engine/column-index columns column-name)
        sort-idx (get-sort-idx columns)]
    (update columns col-idx assoc "sort" sort-idx "direction" sort-direction)))

(defmethod engine/column-metadata-operation :core/remove-sort
  [columns op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)
        col-idx (engine/column-index columns column-name)]
    (update columns col-idx assoc "sort" nil "direction" nil)))

(defmethod engine/apply-operation :core/sort-column
  [tenant-conn table-name columns op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)
        idx-name (str table-name "_" column-name)
        new-cols (engine/column-metadata-operation columns op-spec)]
    (db-create-index tenant-conn {:index-name idx-name
                                  :column-name column-name
                                  :table-name table-name})
    {:success? true
     :columns new-cols}))

(defmethod engine/apply-operation :core/remove-sort
  [tenant-conn table-name columns op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)
        idx-name (str table-name "_" column-name)
        new-cols (engine/column-metadata-operation columns op-spec)]
    (db-drop-index tenant-conn {:index-name idx-name})
    {:success? true
     :columns new-cols}))
