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

(s/def ::layer-commons (s/keys :req-un [::layer.s/aggregationMethod
                                        ::layer.s/popup
                                        ::postgres.filter/filters
                                        ::layer.s/layerType
                                        ::layer.s/legend
                                        ::layer.s/pointSize
                                        ::layer.s/pointColorMapping
                                        ::layer.s/latitude
                                        ::layer.s/longitude
                                        ::layer.s/title
                                        ::layer.s/visible
                                        ::layer.s/pointColorColumn]))

(defmethod layer-type "geo-location" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.geo-location.s/datasetId
                            ::layer.geo-location.s/rasterId
                            ::layer.geo-location.s/geom])))

(defmethod layer-type "raster" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.raster.s/datasetId
                            ::layer.raster.s/rasterId
                            ::layer.raster.s/geom])))

(defmethod layer-type "geo-shape" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.geo-location.s/datasetId
                            ::layer.geo-location.s/rasterId
                            ::layer.geo-location.s/geom
                            ::layer.geo-shape.s/aggregationColumn
                            ::layer.geo-shape.s/aggregationGeomColumn])))

(s/def ::layer (s/multi-spec layer-type :layerType))
(s/def ::layers (s/coll-of ::layer :kind vector? :distinct true))

#_(s/fdef lib.vis.maps/create
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :windshaft-url string?
	 :layers ::layers)
  :ret any?)
