(ns akvo.lumen.specs.components.caddisfly
  (:require [akvo.lumen.component.caddisfly :as caddisfly]
            [akvo.lumen.specs.components :refer (integrant-key)]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(s/def ::caddisfly/local-schema-uri string?)

(s/def ::caddisfly/caddisfly (s/keys :req-un [::caddisfly/local-schema-uri]))

(s/def ::caddisfly/config (s/keys :req-un [::caddisfly/caddisfly] ))

(defmethod integrant-key ::caddisfly/local [_]
  (s/cat :kw keyword? :config (s/keys :req-un [::caddisfly/config])))
