(ns akvo.lumen.lib.dataset.utils)

(defn find-column
  ([columns v]
   (find-column columns v :columnName))
  ([columns v filter-by]
   (when v
     (if-let [column (first (filter #(= v (filter-by %)) columns))]
       column
       (throw (ex-info (str "No such column: " v) {filter-by v}))))))
