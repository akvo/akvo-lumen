(ns akvo.lumen.specs.collection
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.lib.visualisation :as visualisation]
            [clojure.spec.alpha :as s]))

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id (s/with-gen
              #'*id?*
              lumen.s/str-uuid-gen))

(s/def ::collection (s/keys :req-un [::id]))

(s/def ::datasets (s/coll-of ::collection :distinct true))
