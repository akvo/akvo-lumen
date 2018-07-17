(ns akvo.lumen.specs.visualisation.layer.legend
  (:require [akvo.lumen.specs.core :as lumen.s]
	    [clojure.spec.alpha :as s]))

(s/def ::title ::lumen.s/string-nullable)

(s/def ::visible boolean?)

(s/def ::legend (s/keys :req-un [::title ::visible]))
