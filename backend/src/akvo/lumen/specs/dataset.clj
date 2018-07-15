(ns akvo.lumen.specs.dataset
    (:require [clojure.spec.alpha :as s]
	      [akvo.lumen.specs.core :as lumen.s]
	      [akvo.lumen.specs.dataset.column :as dataset.column]
	      [akvo.lumen.lib.dataset :as l.dataset]))

(s/def ::column (s/keys :req-un [::dataset.column/columnName]
			:opt-un [::dataset.column/sort
				 ::dataset.column/type
				 ::dataset.column/title
				 ::dataset.column/hidden
				 ::dataset.column/direction]))


(s/def ::columns (s/coll-of ::column :gen-max 3))

(s/def ::table-name string?)
(s/def ::title string?)
(s/def ::created int?)
(s/def ::modified int?)
(s/def ::updated int?)
(s/def ::id string?)
(s/def ::transformations any?)
(s/def ::dataset (s/keys :req-un [::created
				  ::id
				  ::modified
				  ::table-name
				  ::title
				  ::transformations
				  ::updated]))
