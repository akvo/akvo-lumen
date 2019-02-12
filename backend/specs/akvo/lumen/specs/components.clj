(ns akvo.lumen.specs.components
  (:require [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defmulti integrant-key first)

(defmethod integrant-key :default [_]
  (s/cat :kw keyword? :opts any?))

(s/def :integrant/component-args (s/multi-spec integrant-key identity))

(s/fdef ig/init-key :args :integrant/component-args)

