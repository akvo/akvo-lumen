(ns akvo.lumen.specs.visualisation.maps
  (:require [akvo.lumen.lib.visualisation.maps :as lib.vis.maps]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.visualisation.maps.layer :as layer.s]
            [clojure.spec.alpha :as s]))

(alias 'layer.geo-location.s 'akvo.lumen.specs.visualisation.maps.layer.geo-location)
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
                                        ::layer.s/geom
                                        ::layer.s/visible
                                        ::layer.s/pointColorColumn                                        
                                        ]))

(defmethod layer-type "geo-location" [_]
  (s/merge ::layer-commons
           (s/keys :req-un [::layer.geo-location.s/datasetId
                            ::layer.geo-location.s/rasterId])))

(defmethod layer-type "raster" [_]
    (s/merge ::layer-commons
           (s/keys :req-un [::layer.raster.s/datasetId
                            ::layer.raster.s/rasterId])))


(defmethod layer-type "geo-shape" [_]
  (s/keys :req-un [::layerType]))

(s/def ::layer (s/multi-spec layer-type :layerType))


(s/fdef lib.vis.maps/create
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :windshaft-url string?
	 :layers (s/coll-of ::layer :kind vector? :distinct true))
  :ret any?)
