(ns akvo.lumen.specs.transformations.merge-dataset.source
  (:require [akvo.lumen.specs.dataset.column :as dataset.column.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.dataset :as dataset]
            [clojure.spec.alpha :as s]))

(s/def ::mergeColumn ::dataset.column.s/columnName)
(s/def ::mergeColumns (s/coll-of ::mergeColumn :gen-max 3))
(s/def ::datasetId ::dataset/id)
(s/def ::aggregationColumn ::dataset.column.s/columnName)
(s/def ::aggregationDirection #{"ASC" "DESC"})
