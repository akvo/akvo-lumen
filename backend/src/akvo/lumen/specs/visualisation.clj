(ns akvo.lumen.specs.visualisation
  (:require [akvo.lumen.lib.visualisation :as lib.visualisation]
	    [akvo.lumen.lib.visualisation.map-config :as l.visualisation.map-config]
	    [akvo.lumen.lib.visualisation.map-metadata :as l.visualisation.map-metadata]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.visualisation.layer :as visualisation.layer.s]
	    [akvo.lumen.specs.visualisation.layer.legend :as layer.legend.s]
	    [akvo.lumen.specs.visualisation.layer.spec :as layer.spec.s]
	    [akvo.lumen.specs.db :as db.s]
	    [clojure.spec.alpha :as s]))

(s/def ::lib.visualisation/type string?)
(s/def ::lib.visualisation/name string?)
(s/def ::lib.visualisation/visualisationType
  #{"map" "pivot table" "bar" "line" "area" "pie" "donut" "scatter"})
(s/def ::lib.visualisation/datasetId (s/or :v ::dataset.s/id
					   :n nil?))

(s/def ::lib.visualisation/created ::lumen.s/date-int)
(s/def ::lib.visualisation/modified ::lumen.s/date-int)
(s/def ::lib.visualisation/status #{"OK"})
(s/def ::lib.visualisation/id string?)
(s/def ::lib.visualisation/body
  (s/keys :req-un [::lib.visualisation/datasetId
		   ::lib.visualisation/name
		   ::lib.visualisation/spec
		   ::lib.visualisation/type
		   ::lib.visualisation/visualisationType]

	  :opt-un [::lib.visualisation/created
		   ::lib.visualisation/modified
		   ::layer.spec.s/spec
		   ::lib.visualisation/status
		   ::lib.visualisation/id]))

(s/fdef lib.visualisation/all
  :args (s/cat
	 :tenant-conn ::db.s/tenant-connection))

(s/fdef lib.visualisation/create
  :args (s/cat
	 :tenant-conn ::db.s/tenant-connection
	 :body ::lib.visualisation/body
	 :jwt-claims map?))

(s/fdef lib.visualisation/upsert
  :args (s/cat
	 :tenant-conn ::db.s/tenant-connection
	 :body ::lib.visualisation/body
	 :jwt-claims map?))

(s/fdef lib.visualisation/fetch
  :args (s/cat
	 :tenant-conn ::db.s/tenant-connection
	 :id ::lib.visualisation/id))

(s/fdef lib.visualisation/delete
  :args (s/cat
	 :tenant-conn ::db.s/tenant-connection
	 :id ::lib.visualisation/id))
