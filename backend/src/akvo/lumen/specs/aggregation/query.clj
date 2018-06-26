(ns akvo.lumen.specs.aggregation.query
  (:require [akvo.lumen.specs.core :as lumen.s]
            [clojure.spec.alpha :as s]))

(s/def ::operation #{"keep"  "remove"})

(s/def ::strategy #{"isHigher" "isLower" "is" "isEmpty"})

(s/def ::value ::lumen.s/string-nullable)

(s/def ::column string?)

(s/def ::filter (s/keys :req-un [::operation
                                 ::strategy
                                 ::value
                                 ::column]))

(s/def ::filters (s/or :col (s/coll-of ::filter :gen-max 3)
		       :nil nil?))

(s/def ::aggregation #{"mean" "sum" "min" "max" "count"})

(s/def ::categoryColumn ::column)
(s/def ::rowColumn ::column)
(s/def ::valueColumn ::column)
