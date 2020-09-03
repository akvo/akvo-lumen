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
;; TODO this affects on how transformations and columns in a dataset_version are related :/
(defmethod engine/apply-operation "core/rename-column"
  [{:keys [tenant-conn]} dataset-versions columns op-spec]
  (if-let [response-error (engine/column-title-error? (new-col-title op-spec) columns)]
    response-error
    (let [column-name      (col-name op-spec)
          new-column-title (new-col-title op-spec)]
      {:success?      true
       :execution-log [(format "Renamed column %s to %s" column-name new-column-title)]
       :columns       (engine/update-column columns column-name assoc "title" new-column-title)})))

(defmethod engine/columns-used "core/rename-column"
  [applied-transformation columns]
  [(-> applied-transformation :args :columnName)])
