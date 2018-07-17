(ns akvo.lumen.specs.postgres
  (:require [akvo.lumen.dataset :as dataset]
	    [akvo.lumen.postgres.filter :as postgres.filter]
	    [akvo.lumen.specs.aggregation.query :as aggregation.query.s]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.dataset.column :as dataset.column.s]
	    [clojure.spec.alpha :as s]))

(s/def ::postgres.filter/filter (s/keys :req-un [::aggregation.query.s/operation
                                                 ::aggregation.query.s/strategy
                                                 ::aggregation.query.s/value
                                                 ::dataset/column]))

(s/def ::postgres.filter/categoryColumn ::dataset/column)

(s/def ::postgres.filter/rowColumn ::dataset/column)

(s/def ::postgres.filter/valueColumn ::dataset/column)

(s/def ::postgres.filter/aggregation string?)

(s/def ::postgres.filter/filters (s/coll-of ::postgres.filter/filter :gen-max 3))

(s/def ::postgres.filter/comparison-op #{">" "<="})

(s/fdef postgres.filter/sql-str
  :args (s/cat
	 :columns ::dataset/columns
	 :filters ::aggregation.query.s/filters)
  :ret string?)

(s/fdef postgres.filter/filter-sql
  :args (s/cat
	 :filter ::postgres.filter/filter)
  :ret string?)

(s/fdef postgres.filter/comparison
  :args (s/cat
	 :op ::postgres.filter/comparison-op
	 :column-type ::dataset.column.s/type
	 :column-name ::dataset.column.s/columnName
	 :value ::aggregation.query.s/value)
  :ret string?)
