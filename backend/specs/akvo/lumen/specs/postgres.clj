(ns akvo.lumen.specs.postgres
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.util :as u]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(alias 'db.dsv 'akvo.lumen.specs.db.dataset-version)

(s/def ::postgres.filter/strategy #{"isHigher" "isLower" "is" "isEmpty"})

(s/def ::postgres.filter/operation #{"keep"  "remove"})

(s/def ::postgres.filter/aggregation #{"mean" "sum" "min" "max" "count"})

(s/def ::postgres.filter/value (s/nilable string?))

(alias 'db.dsv.column 'akvo.lumen.specs.db.dataset-version.column)

(s/def ::postgres.filter/column ::db.dsv.column/columnName)
(s/def ::postgres.filter/filter (s/nilable (s/keys :req-un [::postgres.filter/operation
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
	 :columns ::db.dsv/columns
	 :filters (s/nilable ::postgres.filter/filters))
  :ret string?)


