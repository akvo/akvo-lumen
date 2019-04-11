(ns akvo.lumen.specs.dashboard
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
(s/def ::title string?)
(s/def ::status string?)
(s/def ::type #{"dashboard"})
(s/def ::created ::lumen.s/date-number)
(s/def ::modified ::lumen.s/date-number)
(s/def ::visualisationId (s/nilable ::visualisation.s/id))
(s/def ::visualisations (s/coll-of ::visualisationId :distinct true))
(s/def ::dashboard (s/keys :req-un [::id ::title ::status ::type ::created ::modified]
                           :opt-un [::visualisations]))
(s/def ::dashboards (s/coll-of ::dashboard :distinct true))
