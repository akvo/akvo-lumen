(ns akvo.lumen.specs.postgres
  (:require [akvo.lumen.postgres :as postgres]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs.db.dataset-version :as db.dsv]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column]
            [clojure.spec.alpha :as s]))

(s/def ::postgres.filter/strategy (s/nilable #{"isHigher" "isLower" "is" "isEmpty"}))

(s/def ::postgres.filter/operation (s/nilable #{"keep"  "remove"}))

(s/def ::postgres.filter/aggregation #{"mean" "sum" "min" "max" "count"})

(s/def ::postgres.filter/value (s/nilable (s/or :string string?
                                                :number number?)))

(s/def ::postgres.filter/column ::db.dsv.column/columnName)
(s/def ::postgres.filter/filter
  (s/nilable (s/keys :req-un [::postgres.filter/operation
                              ::postgres.filter/strategy
                              ::postgres.filter/value
                              ::postgres.filter/column])))

(s/def ::postgres.filter/filters (s/coll-of ::postgres.filter/filter :gen-max 3))

(s/def ::postgres.filter/categoryColumn ::db.dsv/column)

(s/def ::postgres.filter/rowColumn ::db.dsv/column)

(s/def ::postgres.filter/valueColumn ::db.dsv/column)

(s/def ::postgres.filter/aggregation string?)

(s/def ::postgres.filter/comparison-op #{">" "<=" "<" ">=" "=" "<>"})

(s/fdef postgres.filter/sql-str
  :args (s/cat
	 :columns (s/nilable (s/coll-of ::db.dsv/column :distinct true))
	 :filters (s/nilable ::postgres.filter/filters))
  :ret string?)
