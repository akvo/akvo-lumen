(ns akvo.lumen.specs.dataset
  (:require [akvo.lumen.specs :as lumen.s]
            [clojure.spec.alpha :as s]))

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id (s/with-gen
              #'*id?*
              lumen.s/str-uuid-gen))
