(ns akvo.lumen.component.flow
  "wrap flow and flow api logic and data related"
  (:require [integrant.core :as ig]
            [clojure.spec.alpha :as s]))

(defmethod ig/init-key ::api  [_ {:keys [url] :as opts}]
  opts)

(s/def ::url string?)
(s/def ::config (s/keys :req-un [::url]))

(defmethod ig/pre-init-spec ::api [_]
  ::config)
