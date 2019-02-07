(ns akvo.lumen.specs.visualisation.maps.layer
  (:require [akvo.lumen.specs :as lumen.s]
            [clojure.string :as str]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [clojure.spec.alpha :as s]
            )
  (:import [java.awt Color]))

(create-ns  'akvo.lumen.specs.visualisation.maps.layer.legend)

(alias 'layer.legend.s 'akvo.lumen.specs.visualisation.maps.layer.legend)

(s/def ::layer.legend.s/title (s/nilable string?))
(s/def ::layer.legend.s/visible boolean?)

(s/def ::legend (s/keys :req-un [::layer.legend.s/title ::layer.legend.s/visible]))

(s/def ::layerType #{"geo-location" "geo-shape" "raster"})

(s/def ::aggregationMethod #{"avg"})


(create-ns  'akvo.lumen.specs.visualisation.maps.layer.popup)

(alias 'layer.popup.s 'akvo.lumen.specs.visualisation.maps.layer.popup)

(s/def ::layer.popup.s/column ::db.dsv.column.s/columnName)
(s/def ::popup-item (s/keys :req-un [::layer.popup.s/column]))
(s/def ::popup (s/coll-of ::popup-item :kind vector? :distinct true)) 

(s/def ::pointSize pos-int?)

(create-ns  'akvo.lumen.specs.visualisation.maps.layer.point-color-mapping)

(alias 'layer.point-color-mapping.s 'akvo.lumen.specs.visualisation.maps.layer.point-color-mapping)
(s/def ::layer.point-color-mapping.s/op #{"equals"})
(s/def ::layer.point-color-mapping.s/value double?)

(defn valid-hex? [s] (try
                       (Color/decode s)
                       true
                       (catch Exception e false)))

(s/def ::layer.point-color-mapping.s/color valid-hex?)
(s/def ::point-color-mapping-item (s/keys :req-un [::layer.point-color-mapping.s/op
                                                   ::layer.point-color-mapping.s/value
                                                   ::layer.point-color-mapping.s/color]))
(s/def ::pointColorMapping (s/coll-of ::point-color-mapping-item :kind vector?))

(s/def ::pointColorColumn ::db.dsv.column.s/columnName)
(s/def ::rasterId (s/with-gen
                    lumen.s/str-uuid?
                    lumen.s/str-uuid-gen)) ;; todo recheck
(s/def ::longitude (s/nilable string?)) ;; todo
(s/def ::latitude (s/nilable string?)) ;; todo
(s/def ::title string?)
(s/def ::geom string?) ;; todo derivation columnName 
(s/def ::visible boolean?)

[{:aggregationMethod "avg",
  :popup [],
  :filters [],
  :layerType "geo-location",

  :legend {:title nil, :visible true},

  :rasterId nil,
  :pointSize 3,
  :pointColorMapping [],
  :longitude nil,
  :datasetId "5c5bfbea-6a60-409f-9fcf-11c87a5f7da3",
  :title "Untitled layer 1",
  :geom "d1",
  :pointColorColumn nil,
  :latitude nil,
  :visible true}]
