(ns akvo.lumen.specs.dataset
  (:require [akvo.lumen.dataset :as dataset]
            [akvo.lumen.dataset.utils :as dataset.utils]
            [akvo.lumen.specs.core :as lumen.s]
            [akvo.lumen.specs.dataset.column :as dataset.column]
            [clojure.spec.alpha :as s]))

(s/def ::dataset/column (s/keys :req-un [::dataset.column/columnName]
                                :opt-un [::dataset.column/sort
                                         ::dataset.column/type
                                         ::dataset.column/title
                                         ::dataset.column/hidden
                                         ::dataset.column/direction]))

(s/def ::dataset/columns (s/coll-of ::dataset/column :gen-max 3))

(s/def ::dataset/table-name string?)

(s/def ::dataset/title string?)

(s/def ::dataset/created int?)

(s/def ::dataset/modified int?)

(s/def ::dataset/updated int?)

(s/def ::dataset/id string?)

(s/def ::dataset/transformations any?)

(s/def ::dataset/dataset (s/keys :req-un [::dataset/created
                                          ::dataset/id
                                          ::dataset/modified
                                          ::dataset/table-name
                                          ::dataset/title
                                          ::dataset/transformations
                                          ::dataset/updated]))


(s/fdef dataset.utils/find-column
  :args (s/cat :columns ::dataset/columns
	       :column-name ::lumen.s/string-nullable)
  :ret ::dataset/column)
