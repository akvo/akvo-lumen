(ns akvo.lumen.specs.visualisation.maps.layer
  (:require [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.db.dataset-version :as db.dataset-version.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [clojure.spec.alpha :as s]
            [clojure.string :as str])
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

(defn string-pos-int? [s] (try (pos-int? (Integer/parseInt s))
                          (catch Exception e false)))

(s/def ::pointSize  (s/with-gen
                      (s/or :s string-pos-int? :i pos-int?)
                      #(s/gen #{"1" 1 "2" 2})
                      )) ;; only in geo-location we receive a string :!

(create-ns  'akvo.lumen.specs.visualisation.maps.layer.point-color-mapping)
(alias 'layer.point-color-mapping.s 'akvo.lumen.specs.visualisation.maps.layer.point-color-mapping)

(s/def ::layer.point-color-mapping.s/op #{"equals"})

(s/def ::layer.point-color-mapping.s/value (s/or :d double? :s string?))

(defn valid-hex? [s] (try
                       (Color/decode s)
                       (catch Exception e false)))

(s/def ::layer.point-color-mapping.s/color (s/with-gen
                                             valid-hex?
                                             #(s/gen #{"000" "256256256" "101010"})))

(s/def ::point-color-mapping-item (s/keys :req-un [::layer.point-color-mapping.s/op
                                                   ::layer.point-color-mapping.s/value
                                                   ::layer.point-color-mapping.s/color]))

(s/def ::pointColorMapping (s/coll-of ::point-color-mapping-item :kind vector?))

(s/def ::pointColorColumn (s/nilable ::db.dsv.column.s/columnName))

(s/def ::datasetId ::dataset.s/id)

(s/def ::rasterId  (s/with-gen
                     lumen.s/str-uuid?
                     lumen.s/str-uuid-gen)) ;; todo double check

(s/def ::longitude (s/nilable string?)) ;; todo double check

(s/def ::latitude (s/nilable string?)) ;; todo double check

(s/def ::title string?)

(s/def ::visible boolean?)

(create-ns  'akvo.lumen.specs.visualisation.maps.layer.raster)
(alias 'layer.raster.s 'akvo.lumen.specs.visualisation.maps.layer.raster)

(s/def ::layer.raster.s/datasetId nil?)

(s/def ::layer.raster.s/rasterId ::rasterId)

(s/def ::layer.raster.s/geom nil?)

(create-ns  'akvo.lumen.specs.visualisation.maps.layer.geo-location)
(alias 'layer.geo-location.s 'akvo.lumen.specs.visualisation.maps.layer.geo-location)

(s/def ::layer.geo-location.s/datasetId ::datasetId)

(s/def ::layer.geo-location.s/rasterId nil?)

(s/def ::layer.geo-location.s/geom string?)  ;; todo derivation columnName
