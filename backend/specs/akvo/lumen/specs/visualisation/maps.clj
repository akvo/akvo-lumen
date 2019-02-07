(ns akvo.lumen.specs.visualisation.maps
  (:require [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.visualisation.maps.layer :as layer.s]
            [akvo.lumen.specs.db.dataset-version :as db.dataset-version.s]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [clojure.spec.alpha :as s]))

(defmulti layer-type :layerType)

(defmethod layer-type "geo-location" [_]
  (s/keys :req-un [::layer.s/aggregationMethod
                   ::layer.s/popup
                   ::postgres.filter/filters
                   ::layer.s/layerType
                   ::layer.s/legend
                   ::layer.s/pointSize
                   (s/nilable ::layer.s/rasterId)
                   ::layer.s/pointColorMapping
                   ::db.dataset-version.s/dataset-id
                   ::layer.s/title
                   ::layer.s/pointColorColumn
                   ::layer.s/latitude
                   ::layer.s/longitude
                   ::layer.s/geom
                   ::layer.s/visible
                   ]))

(defmethod layer-type "geo-shape" [_]
  (s/keys :req-un [::layerType]))

(defmethod layer-type "raster" [_]
  (s/keys :req-un [::layerType]))


(s/def ::layer (s/multi-spec layer-type :layerType))
