(ns akvo.lumen.specs.libs
  (:require [clojure.spec.alpha :as s]
	    [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset :as dataset]
	    [akvo.lumen.specs.core :as lumen.s]))

(s/def ::lib/val #{::lib/created ::lib/not-implemented
                   ::lib/no-content ::lib/unprocessable-entity
                   ::lib/redirect ::lib/internal-server-error
                   ::lib/not-authenticated ::lib/ok
                   ::lib/bad-request ::lib/gone
                   ::lib/not-authorized ::lib/conflict
                   ::lib/not-found})

(s/def ::lib/response (s/tuple ::val ::lumen.s/any))

(s/def ::dataset/sort ::lumen.s/int-nullable)
(s/def ::dataset/type #{"text" "number" "date"}) ;; TODO: complete
(s/def ::dataset/hidden boolean?)
(s/def ::dataset/direction ::lumen.s/string-nullable)
(s/def ::dataset/title string?)
(s/def ::dataset/columnName (s/with-gen
                              string?
                              #(s/gen #{"d1" "d2" "d3" "d4"})))

(s/def ::dataset/column (s/keys :req-un [::dataset/type ::dataset/title ::dataset/hidden ::dataset/direction ::dataset/columnName]
                                :opt-un [::dataset/sort]))
