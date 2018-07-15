(ns akvo.lumen.specs.aggregation.pivot.row
  (:require [akvo.lumen.specs.core :as lumen.s]
            [clojure.spec.alpha :as s]))

(s/def ::type string?)

(s/def ::title string?)
