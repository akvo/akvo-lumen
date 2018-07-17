(ns akvo.lumen.specs.libs
  (:require [clojure.spec.alpha :as s]
	    [akvo.lumen.lib :as lib]
	    [akvo.lumen.specs.core :as lumen.s]))

(s/def ::lib/val #{::lib/created ::lib/not-implemented
                   ::lib/no-content ::lib/unprocessable-entity
                   ::lib/redirect ::lib/internal-server-error
                   ::lib/not-authenticated ::lib/ok
                   ::lib/bad-request ::lib/gone
                   ::lib/not-authorized ::lib/conflict
                   ::lib/not-found})

(s/def ::lib/response (s/tuple ::val ::lumen.s/any))
