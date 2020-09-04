(ns akvo.lumen.lib.transformation.filter-column
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation.filter-column :as db.tx.filter-column]
            [clojure.tools.logging :as log]))

(defmethod engine/valid? "core/filter-column"
  [op-spec]
  (boolean (not-empty (get (engine/args op-spec) "expression"))))

(defmethod engine/apply-operation "core/filter-column"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [{expr "expression"
         column-name "columnName"} (engine/args op-spec)
        namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)
        columns (vec (:columns dsv))
        table-name (:table-name dsv)
        expr-fn (first (keys expr))
        expr-val (first (vals expr))
        filter-fn (if (= "is" expr-fn) ;; TODO: logic only valid for text columns
                    "="
                    "ilike")
        filter-val (if (= "contains" expr-fn)
                     (str "%" expr-val "%")
                     expr-val)
        result (db.tx.filter-column/db-filter-column tenant-conn {:table-name table-name
                                              :column-name column-name
                                              :filter-fn filter-fn
                                              :filter-val filter-val})]
    {:success? true
     :execution-log [(str "Deleted " result " rows")]
     :dataset-versions (vals (-> dataset-versions
                                 (assoc-in [namespace :columns] columns)
                                 (update-in ["main" :transformations]
                                            engine/update-dsv-txs op-spec (:columns dsv) columns)))}))

(defmethod engine/columns-used "core/filter-column"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])

(defmethod engine/avoidable-if-missing? "core/filter-column"
  [applied-transformation]
  true)
