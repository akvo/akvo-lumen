(ns akvo.lumen.lib.transformation.rename-column
  (:require [akvo.lumen.util :as util]
            [akvo.lumen.lib.transformation.engine :as engine]))

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defn new-col-title [op-spec]
  (get (engine/args op-spec) "newColumnTitle"))

(defmethod engine/valid? "core/rename-column"
  [op-spec]
  (and (util/valid-column-name? (col-name op-spec))
       (string? (new-col-title op-spec))))

(defmethod engine/apply-operation "core/rename-column"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (if (not-empty (filter #(= (new-col-title op-spec) (get % "title")) columns))
    {:success? false
     :message  (format "In this dataset there's already a column with this name: %s. Please choose another non existing name" (new-col-title op-spec))}
    (let [column-name      (col-name op-spec)
          column-idx       (engine/column-index columns column-name)
          new-column-title (new-col-title op-spec)]
      {:success?      true
       :execution-log [(format "Renamed column %s to %s" column-name new-column-title)]
       :columns       (engine/update-column columns column-name assoc "title" new-column-title)})))

(defmethod engine/columns-used "core/rename-column"
  [applied-transformation columns]
  [(-> applied-transformation :args :columnName)])
