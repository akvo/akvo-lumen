(ns akvo.lumen.transformation.sort-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/sort_column.sql")

(defmethod engine/valid? :core/sort-column
  [op-spec]
  (and (engine/valid-column-name? (get (engine/args op-spec) :columnName))
       (boolean (#{"ASC" "DESC"} (get (engine/args op-spec) :sortDirection)))))

(defmethod engine/valid? :core/remove-sort
  [op-spec]
  (engine/valid-column-name? (get (engine/args op-spec) :columnName)))

(defn- get-sort-idx
  "Returns the next sort index for a given vector of columns"
  [columns]
  (inc (count (filter #(get % :sort) columns))))

(defmethod engine/apply-operation :core/sort-column
  [tenant-conn table-name columns op-spec]
  (let [{:keys [columnName sortDirection]} (engine/args op-spec)
        idx-name (str table-name "_" columnName)
        sort-idx (get-sort-idx columns)
        new-cols (engine/update-column columns
                                       columnName
                                       assoc
                                       "sort" sort-idx
                                       "direction" sortDirection)]
    (db-create-index tenant-conn {:index-name idx-name
                                  :column-name columnName
                                  :table-name table-name})
    {:success? true
     :columns new-cols}))

(defmethod engine/apply-operation :core/remove-sort
  [tenant-conn table-name columns op-spec]
  (let [{:keys [columnName]} (engine/args op-spec)
        idx-name (str table-name "_" columnName)
        new-cols (engine/update-column columns
                                       columnName
                                       assoc
                                       "sort" nil
                                       "direction" nil)]
    (db-drop-index tenant-conn {:index-name idx-name})
    {:success? true
     :columns new-cols}))
