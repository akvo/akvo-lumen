(ns akvo.lumen.specs.visualisation.maps
  (:require [akvo.lumen.lib.visualisation.maps :as lib.vis.maps]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.protocols :as protocols.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.visualisation.maps.layer :as layer.s]
            [clojure.spec.alpha :as s]))

(alias 'layer.geo-location.s 'akvo.lumen.specs.visualisation.maps.layer.geo-location)
(alias 'layer.geo-shape.s 'akvo.lumen.specs.visualisation.maps.layer.geo-shape)
(alias 'layer.raster.s 'akvo.lumen.specs.visualisation.maps.layer.raster)

(defmulti layer-type :layerType)

(s/def ::layer-commons (s/keys :req-un [::layer.s/popup
                                        ::postgres.filter/filters
                                        ::layer.s/legend
                                        ::layer.s/pointSize
                                        ::layer.s/pointColorMapping
                                        ::layer.s/latitude
                                        ::layer.s/longitude
                                        ::layer.s/title
                                        ::layer.s/visible
                                        ::layer.s/pointColorColumn]
                               :opt-un [::layer.s/aggregationMethod
                                        ::layer.s/layerType]))

(defmethod layer-type :default [_]
  ::layer-commons)

(defmethod layer-type "geo-location" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.geo-location.s/datasetId
                            ::layer.geo-location.s/geom]
                   :opt-un [::layer.geo-location.s/rasterId])))

(defmethod layer-type "raster" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.raster.s/datasetId]
                   :opt-un [::layer.raster.s/geom
                            ::layer.raster.s/rasterId])))

(defmethod layer-type "geo-shape" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.geo-location.s/datasetId
                            ::layer.geo-location.s/rasterId
                            ::layer.geo-location.s/geom]
                   :opt-un [::layer.geo-shape.s/aggregationGeomColumn
                            ::layer.geo-shape.s/aggregationColumn])))

(s/def ::layer (s/multi-spec layer-type :layerType))
(s/def ::layers (s/coll-of ::layer :kind vector? :distinct true))

#_(s/fdef lib.vis.maps/create
    :args (s/cat
           :db-conn ::db.s/tenant-connection
	         :windshaft-url string?
	         :layers ::layers)
    :ret any?)
