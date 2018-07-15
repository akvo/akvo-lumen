(ns akvo.lumen.specs.dataset.column
  (:require [clojure.spec.alpha :as s]
	    [akvo.lumen.transformation.engine :as engine]
	    [akvo.lumen.specs.core :as lumen.s]))

(s/def ::sort ::lumen.s/int-nullable)
(s/def ::type engine/valid-column-types)
(s/def ::hidden boolean?)
(s/def ::direction ::lumen.s/string-nullable)
(s/def ::title string?)
(s/def ::columnName (s/with-gen
		      engine/valid-column-name?
		      #(s/gen #{"c1" "c2" "c3" "c4"})))
