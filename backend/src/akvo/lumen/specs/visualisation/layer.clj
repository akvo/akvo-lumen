(ns akvo.lumen.specs.visualisation.layer
  (:require [akvo.lumen.component.tenant-manager :as tenant-manager]
	    [akvo.lumen.lib :as lib]
	    [akvo.lumen.lib.visualisation :as lib.visualisation]
            [akvo.lumen.lib.visualisation.map-config :as l.visualisation.map-config]
            [akvo.lumen.lib.visualisation.map-metadata :as l.visualisation.map-metadata]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.dataset.column :as dataset.column.s]
            [akvo.lumen.specs.visualisation.layer.legend :as layer.legend.s]
	    [akvo.lumen.specs.db :as db.s]
	    [akvo.lumen.specs.libs]
	    [clojure.spec.alpha :as s]))

(s/def ::aggregationMethod #{"avg"} ) ;; TODO: check with /Users/tangrammer/git/akvo/akvo-lumen/backend/src/akvo/lumen/specs/aggregation/query.clj::21

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
