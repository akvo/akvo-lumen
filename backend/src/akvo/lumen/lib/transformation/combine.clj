(ns akvo.lumen.lib.transformation.combine
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation.combine :as db.tx.combine]
            [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [akvo.lumen.util :as util]
            [clojure.tools.logging :as log]))

(defmethod engine/valid? "core/combine"
  [op-spec]
  (let [{[column-name-1 column-name-2] "columnNames"
         column-title "newColumnTitle"
         separator "separator"} (engine/args op-spec)]
    (boolean (and (every? util/valid-column-name? [column-name-1 column-name-2])
                  (string? column-title)
                  (string? separator)
                  (= (engine/error-strategy op-spec) "fail")))))

(defmethod engine/apply-operation "core/combine"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)
        table-name (:table-name dsv)
        columns (vec (:columns dsv))
        new-column-name (engine/next-column-name columns)
        {[first-column-name second-column-name] "columnNames"
         separator "separator"
         column-title "newColumnTitle"} (engine/args op-spec)
        new-columns (conj columns {"title" column-title
                                   "type" "text"
                                   "sort" nil
                                   "hidden" false
                                   "direction" nil
                                   "columnName" new-column-name})]
    (if-let [title-error (engine/column-title-error? column-title columns)]
      title-error
      (do 
        (db.tx.engine/add-column tenant-conn {:table-name table-name
                                              :column-type "text"
                                              :new-column-name new-column-name})
        (let [tables (vec (map :table-name (keys (dissoc dataset-versions namespace))))]
          ((if (seq tables) db.tx.combine/combine-columns-from-tables db.tx.combine/combine-columns)
           tenant-conn
           {:table-name table-name
            :tables tables
            :new-column-name new-column-name
            :first-column (str table-name "." first-column-name)
            :second-column (str table-name "." second-column-name)
            :separator separator}))
        {:success? true
         :execution-log [(format "Combined columns %s, %s into %s"
                                 first-column-name second-column-name new-column-name)]
         :namespace namespace
         :dataset-versions (vals (-> dataset-versions
                                     (assoc-in [namespace :columns] new-columns)
                                     (update-in ["main" :transformations]
                                                engine/update-dsv-txs op-spec columns new-columns)))}))))

(defmethod engine/columns-used "core/combine"
  [applied-transformation columns]
  [(:columnNames (:args applied-transformation))])
