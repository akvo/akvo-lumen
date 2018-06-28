(ns akvo.lumen.specs.transformations.merge-dataset.target
  (:require [akvo.lumen.specs.dataset.column :as dataset.column.s]
	    [clojure.spec.alpha :as s]))

(s/def ::mergeColumn ::dataset.column.s/columnName)
