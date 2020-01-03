(ns akvo.lumen.specs.collection
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [akvo.lumen.specs.dashboard :as dashboard.s]
            [akvo.lumen.specs.raster :as raster.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.lib.visualisation :as visualisation]
            [clojure.spec.alpha :as s]))

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id? #'*id?*)

(s/def ::id  (s/with-gen
               ::id?
               lumen.s/str-uuid-gen))

(s/def ::created ::lumen.s/date-number)

(s/def ::modified ::lumen.s/date-number)

(s/def ::title string?)

(s/def ::dashboards (s/coll-of ::dashboard.s/id :distinct true))

(s/def ::visualisations (s/coll-of ::visualisation.s/id :distinct true))

(s/def ::datasets (s/coll-of ::dataset.s/id :distinct true))

(s/def ::rasters (s/coll-of ::raster.s/id :distinct true))

(s/def ::collection (s/keys :req-un [::id ::created ::modified]))

(s/def ::collection-post-payload (s/keys :req-un [::title]
                                         :opt-un [::rasters ::datasets ::visualisations ::dashboards]))

(s/def ::collection-payload (s/merge ::collection ::collection-post-payload))
