(ns akvo.lumen.lib.transformation.sort-column
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/sort_column.sql")

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
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [{column-name "columnName"
         sort-direction "sortDirection"} (engine/args op-spec)
        idx-name (str table-name "_" column-name)
        sort-idx (get-sort-idx columns)
        new-cols (engine/update-column columns
                                       column-name
                                       assoc
                                       "sort" sort-idx
                                       "direction" sort-direction)]
    (db-create-index tenant-conn {:index-name idx-name
                                  :column-name column-name
                                  :table-name table-name})
    {:success? true
     :columns new-cols}))

(defmethod engine/apply-operation "core/remove-sort"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)
        idx-name (str table-name "_" column-name)
        new-cols (engine/update-column columns
                                       column-name
                                       assoc
                                       "sort" nil
                                       "direction" nil)]
    (db-drop-index tenant-conn {:index-name idx-name})
    {:success? true
     :columns new-cols}))
