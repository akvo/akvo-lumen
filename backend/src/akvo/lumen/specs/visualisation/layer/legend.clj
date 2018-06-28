(ns akvo.lumen.specs.visualisation.layer.legend
  (:require
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.libs]
	    [clojure.spec.alpha :as s]))

(s/def ::title (s/or :v string? :n nil?))
(s/def ::visible boolean?)

(s/def ::legend (s/keys :req-un [::title ::visible]))
