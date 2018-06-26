(ns akvo.lumen.lib.aggregation.utils)

(defn find-column [columns column-name]
  (when column-name
    (if-let [column (first (filter #(= column-name (:columnName %)) columns))]
      column
      (throw (ex-info "No such column" {:columnName column-name})))))
