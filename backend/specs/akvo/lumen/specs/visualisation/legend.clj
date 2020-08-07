(ns akvo.lumen.specs.visualisation.legend
  (:require [akvo.lumen.specs :as lumen.s]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]))

(s/def ::title (s/nilable string?))

(s/def ::visible boolean?)

(s/def ::position #{"right" "top" "left" "bottom"})
