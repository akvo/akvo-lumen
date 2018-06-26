(ns akvo.lumen.specs.dataset.column
  (:require [clojure.spec.alpha :as s]
            [akvo.lumen.specs.core :as lumen.s]))

(s/def ::sort ::lumen.s/int-nullable)
(s/def ::type #{"text" "number" "date"}) ;; TODO: complete
(s/def ::hidden boolean?)
(s/def ::direction ::lumen.s/string-nullable)
(s/def ::title string?)
(s/def ::columnName (s/with-gen
                      string?
                      #(s/gen #{"d1" "d2" "d3" "d4"})))
