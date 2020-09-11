(ns akvo.lumen.lib.transformation.sort-column
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation.sort-column :as db.tx.sort-column]
            [akvo.lumen.util :as util]))

(defmethod engine/valid? "core/sort-column"
  [op-spec]
  (and (util/valid-column-name? (get (engine/args op-spec) "columnName"))
       (boolean (#{"ASC" "DESC"} (get (engine/args op-spec) "sortDirection")))))

(defmethod engine/valid? "core/remove-sort"
  [op-spec]
  (util/valid-column-name? (get (engine/args op-spec) "columnName")))

(defn- get-sort-idx
  "Returns the next sort index for a given vector of columns"
  [columns]
  (inc (count (filter #(get % "sort") columns))))

(defmethod engine/apply-operation "core/sort-column"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [{column-name "columnName"
         sort-direction "sortDirection"} (engine/args op-spec)
        namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)
        table-name (:table-name dsv)
        columns (vec (:columns dsv))
        idx-name (str table-name "_" column-name)
        sort-idx (get-sort-idx columns)
        new-cols (engine/update-column columns
                                       column-name
                                       assoc
                                       "sort" sort-idx
                                       "direction" sort-direction)]
    (db.tx.sort-column/db-create-index tenant-conn {:index-name idx-name
                                  :column-name column-name
                                  :table-name table-name})
    {:success? true
     :dataset-versions (vals (-> dataset-versions
                                 (assoc-in [namespace :columns] new-cols)
                                 (update-in [namespace :transformations]
                                            engine/update-dsv-txs op-spec (:columns dsv) new-cols)))}))

(defmethod engine/columns-used "core/sort-column"
  [applied-transformation columns]
  [(-> applied-transformation :args :columnName)])

(defmethod engine/avoidable-if-missing? "core/sort-column"
  [applied-transformation]
  true)

(defmethod engine/apply-operation "core/remove-sort"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)
        namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)
        table-name (:table-name dsv)
        columns (:columns dsv)
        idx-name (str table-name "_" column-name)
        new-cols (engine/update-column columns
                                       column-name
                                       assoc
                                       "sort" nil
                                       "direction" nil)]
    (db.tx.sort-column/db-drop-index tenant-conn {:index-name idx-name})
    {:success? true
     :columns new-cols}))

(defmethod engine/columns-used "core/remove-sort"
  [applied-transformation columns]
  [(-> applied-transformation :args :columnName)])

(defmethod engine/avoidable-if-missing? "core/remove-sort"
  [applied-transformation]
  true)
