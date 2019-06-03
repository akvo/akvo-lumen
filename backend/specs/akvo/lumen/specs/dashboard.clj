(ns akvo.lumen.specs.dashboard
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.lib.visualisation :as visualisation]
            [clojure.spec.alpha :as s]))

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id? #'*id?*)

(s/def ::id  (s/with-gen
               ::id?
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
(s/def ::author map?)
(s/def ::layout map?)

(create-ns  'akvo.lumen.specs.dashboard.entity)
(alias 'dashboard.entity.s 'akvo.lumen.specs.dashboard.entity)

(create-ns  'akvo.lumen.specs.dashboard.entity.visualisation)
(alias 'dashboard.entity.visualisation.s 'akvo.lumen.specs.dashboard.entity.visualisation)

(create-ns  'akvo.lumen.specs.dashboard.entity.text)
(alias 'dashboard.entity.text.s 'akvo.lumen.specs.dashboard.entity.text)

(s/def ::dashboard.entity.visualisation.s/id ::visualisation.s/id)
(s/def ::dashboard.entity.text.s/id string?)
(s/def ::dashboard.entity.s/type #{"visualisation" "text"})

(defmulti entity :type)

(s/def ::entity
  (s/multi-spec entity :type))

(defmethod entity "text"  [_]
  (s/keys :req-un [::dashboard.entity.s/type ::dashboard.entity.text.s/id]))

(defmethod entity "visualisation"  [_]
  (s/keys :req-un [::dashboard.entity.s/type ::dashboard.entity.visualisation.s/id]))

(s/def ::entities (s/map-of keyword? ::entity))

(s/def ::dashboard-post-payload (s/keys :req-un [::title ::type ::created ::modified ::layout ::entities]
                                        :opt-un [::visualisations ::status]))

(s/def ::dashboard-payload (s/merge (s/keys :req-un [::id ::author]) ::dashboard-post-payload))
