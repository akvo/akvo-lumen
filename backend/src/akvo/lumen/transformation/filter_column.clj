(ns akvo.lumen.transformation.filter-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/filter_column.sql")

(defmethod engine/valid? :core/filter-column
  [op-spec]
  (boolean (not-empty (get (engine/args op-spec) :expression))))

(defmethod engine/apply-operation :core/filter-column
  [tenant-conn table-name columns op-spec]
  (let [{:keys [expression columnName]} (engine/args op-spec)
        expr-fn (first (keys expression))
        expr-val (first (vals expression))
        filter-fn (if (= :is expr-fn) ;; TODO: logic only valid for text columns
                    "="
                    "ilike")
        filter-val (if (= :contains expr-fn)
                     (str "%" expr-val "%")
                     expr-val)
        result (db-filter-column tenant-conn {:table-name table-name
                                              :column-name columnName
                                              :filter-fn filter-fn
                                              :filter-val filter-val})]
    {:success? true
     :execution-log [(str "Deleted " result " rows")]
     :columns columns}))
