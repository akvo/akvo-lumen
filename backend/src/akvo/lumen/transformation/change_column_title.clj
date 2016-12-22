(ns akvo.lumen.transformation.change-column-title
  (:require [akvo.lumen.transformation.engine :as engine]))

(defmethod engine/valid? :core/change-column-title
  [op-spec]
  (let [{column-name "columnName"
         column-title "columnTitle"} (engine/args op-spec)]
    (and (engine/valid-column-name? column-name)
         (string? column-title))))

(defmethod engine/apply-operation :core/change-column-title
  [tenant-conn table-name columns op-spec]
  (try
    (let [{column-name "columnName"
           column-title "columnTitle"} (engine/args op-spec)
          columns (engine/update-column columns column-name assoc "title" column-title)]
      {:success? true
       :execution-log [(format "Changed column title of %s to %s"
                               column-title column-title)]
       :columns columns})
    (catch Exception e
      {:success? false
       :message (.getMessage e)})))
