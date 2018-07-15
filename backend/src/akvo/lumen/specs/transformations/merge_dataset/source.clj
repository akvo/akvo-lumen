(ns akvo.lumen.specs.transformations.merge-dataset.source
     (:require [akvo.lumen.specs.dataset.column :as dataset.column.s]
	       [clojure.spec.alpha :as s]))


#_(defmethod engine/valid? :core/merge-datasets
    [op-spec]
    (let [source (get-in op-spec [:args :source])
	  target (get-in op-spec [:args :target])]
      (and (engine/valid-column-name? (get source :mergeColumn))
	   (every? engine/valid-column-name? (get source :mergeColumns))
	   (engine/valid-dataset-id? (get source :datasetId))
	   (let [aggregation-column (get source :aggregationColumn)]
	     (or (nil? aggregation-column)
		 (engine/valid-column-name? aggregation-column)))
	   (#{"ASC" "DESC"} (get source :aggregationDirection))
	   (engine/valid-column-name? (get target :mergeColumn)))))
