(ns akvo.lumen.specs.postgres
  (:require [akvo.lumen.dataset :as dataset]
	    [akvo.lumen.postgres.filter :as postgres.filter]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.dataset.column :as dataset.column.s]
	    [clojure.spec.alpha :as s]))

(s/def ::postgres.filter/strategy #{"isHigher" "isLower" "is" "isEmpty"})

(s/def ::postgres.filter/operation #{"keep"  "remove"})

(s/def ::postgres.filter/aggregation #{"mean" "sum" "min" "max" "count"})

(s/def ::postgres.filter/value ::lumen.s/string-nullable)

(s/def ::postgres.filter/filter (s/keys :req-un [::postgres.filter/operation
                                                 ::postgres.filter/strategy
                                                 ::postgres.filter/value
                                                 ::dataset/column]))

(s/def ::postgres.filter/filters (s/coll-of ::postgres.filter/filter :gen-max 3))

(s/def ::postgres.filter/categoryColumn ::dataset/column)

(s/def ::postgres.filter/rowColumn ::dataset/column)

(s/def ::postgres.filter/valueColumn ::dataset/column)

(s/def ::postgres.filter/aggregation string?)

(s/def ::postgres.filter/comparison-op #{">" "<=" "<" ">=" "=" "<>"})

(s/fdef postgres.filter/sql-str
  :args (s/cat
	 :columns ::dataset/columns
	 :filters ::postgres.filter/filters)
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
	 :value ::postgres.filter/value)
  :ret string?)
