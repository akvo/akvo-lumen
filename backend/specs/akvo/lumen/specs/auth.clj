(ns akvo.lumen.specs.auth
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.lib.auth :as l.auth]
            [akvo.lumen.specs.protocols :as protocols.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [clojure.spec.alpha :as s]))

(s/def ::auth-visualisations (s/coll-of ::visualisation.s/id :distinct true))
(s/def ::auth-datasets (s/coll-of ::dataset.s/id :distinct true))
(s/def ::auth-uuid-tree (s/keys :req-un [::auth-datasets ::auth-visualisations]))

(s/fdef l.auth/new-auth-service
  :args (s/cat :auth-uuid-tree ::auth-uuid-tree)
  :ret ::protocols.s/auth-service)
