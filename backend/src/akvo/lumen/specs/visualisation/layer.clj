(ns akvo.lumen.specs.visualisation.layer
  (:require [akvo.lumen.lib :as lib]
	    [akvo.lumen.specs.core :as lumen.s]
            [akvo.lumen.specs.visualisation.layer.legend :as layer.legend.s]
	    [clojure.spec.alpha :as s]))

;; TODO: check with akvo-lumen/backend/src/akvo/lumen/specs/aggregation/query.clj::21 and|or akvo-lumen/backend/src/akvo/lumen/specs/postgres.clj::13
(s/def ::aggregationMethod #{"avg"} ) 

(s/def ::popup  coll?)

(s/def ::filters coll?)

(s/def ::layerType #{"geo-location" "geo-shape" "raster"})

(s/def ::legend (s/keys :req-un [::layer.legend.s/title ::layer.legend.s/visible])) 

(s/def ::rasterId (s/or :v ::lumen.s/str-uuid
                        :n nil?))

(s/def ::pointSize (s/or :s ::lumen.s/str-int
                         :i int?))

(s/def ::pointColorMapping coll?) 

(s/def ::longitude (s/or :v ::lumen.s/any :n nil?))

(s/def ::latitude (s/or :v ::lumen.s/any :n nil?))

(s/def ::datasetId (s/or :v ::lumen.s/str-uuid :n nil?))

(s/def ::title string?)

(s/def ::geom (s/or :v string? :n nil?))

(s/def ::pointColorColumn (s/or :v ::lumen.s/any :n nil?))

(s/def ::visible boolean?)

(s/def ::layer (s/keys :req-un [::aggregationMethod 
                                ::popup 
                                ::filters 
                                ::layerType 
                                ::legend 
                                ::pointSize 
                                ::pointColorMapping 
                                ::longitude 
                                ::datasetId 
                                ::title 
                                ::geom 
                                ::pointColorColumn 
                                ::latitude 
                                ::visible]
                       :opt-un [::rasterId]))
