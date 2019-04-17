(ns akvo.lumen.specs.collection
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [akvo.lumen.specs.dashboard :as dashboard.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.lib.visualisation :as visualisation]
            [clojure.spec.alpha :as s]))

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id (s/with-gen
              #'*id?*
              lumen.s/str-uuid-gen))

(s/def ::created ::lumen.s/date-number)

(s/def ::modified ::lumen.s/date-number)

(s/def ::title string?)

(s/def ::entity (s/or :dash ::dashboard.s/id :vis ::visualisation.s/id :ds ::dataset.s/id))

(s/def ::entities (s/coll-of ::entity :distinct true))

(s/def ::collection (s/keys :req-un [::id ::created ::modified ::entities]))

(s/def ::collection-post-payload (s/keys :req-un [::title]
                                         :opt-un [::entities]))

(s/def ::collection-payload (s/merge ::collection ::collection-post-payload))
