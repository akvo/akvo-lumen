(ns akvo.lumen.specs.visualisation
  (:require [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.aggregation.bar :as aggregation.bar]
            [akvo.lumen.lib.aggregation.bubble :as aggregation.bubble]
            [akvo.lumen.specs.protocols :as protocols.s]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.aggregation.line :as aggregation.line]
            [akvo.lumen.lib.aggregation.pie :as aggregation.pie]
            [akvo.lumen.lib.aggregation.pivot :as aggregation.pivot]
            [akvo.lumen.lib.aggregation.scatter :as aggregation.scatter]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.aggregation :as aggregation.s]
            [akvo.lumen.specs.db.dataset-version :as db.dsv.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [akvo.lumen.lib.visualisation :as visualisation]
            [clojure.spec.alpha :as s]))

(s/def ::name string?)
(s/def ::visualisationType #{"pie" "area" "bar" "line" "polararea" "donut" "pivot table" "scatter" "bubble" "map"})
(s/def ::type #{"visualisation"})
(s/def ::date-number (s/nilable number?))
(s/def ::created ::date-number)
(s/def ::modified ::date-number)
(s/def ::datasetId (s/nilable ::db.dsv.s/dataset-id))
(s/def ::status #{"OK"})
(s/def ::id (s/with-gen
              lumen.s/str-uuid?
              lumen.s/str-uuid-gen))

(s/def ::version int?)
(s/def ::sort any?)
(s/def ::showLegend (s/nilable boolean?))
(s/def ::showLabels (s/nilable boolean?))
(s/def ::legendPosition (s/nilable #{"right" "top" "left" "bottom"}))
(s/def ::legendTitle string?)

(defmulti vis :visualisationType)

(s/def ::visualisation
  (s/multi-spec vis :visualisationType))

(create-ns  'akvo.lumen.specs.visualisation.pie)
(alias 'pie.s 'akvo.lumen.specs.visualisation.pie)

(s/def ::base-spec (s/keys :req-un [::version ::sort ::showLegend ::legendTitle ::showLabels ::legendPosition]))

(s/def ::base-viz (s/keys :req-un [::name ::visualisationType ::datasetId]
                          :opt-un [::created ::modified ::id ::type]))

(s/def ::pie.s/spec (s/merge
                     (s/keys :req-un [::postgres.filter/filters ::aggregation.pie/bucketColumn])
                     ::base-spec))

(defmethod vis "pie"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::pie.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.area)
(alias 'area.s 'akvo.lumen.specs.visualisation.area)

(s/def ::axisLabelXFromUser boolean?)
(s/def ::axisLabelX (s/nilable string?))
(s/def ::axisLabelYFromUser boolean?)
(s/def ::axisLabelY (s/nilable string?))
(s/def ::metricColumnX ::db.dsv.column.s/columnName)
(s/def ::metricColumnY ::db.dsv.column.s/columnName)
(s/def ::bucketColumn (s/nilable ::db.dsv.column.s/columnName))

(s/def ::area.s/spec (s/merge (s/keys :req-un [::postgres.filter/filters])
                              ::base-spec
                              (s/keys :req-un [::metricColumnY ::metricColumnX ::bucketColumn ::aggregation/metricAggregation
                                               ::axisLabelXFromUser ::axisLabelX
                                               ::axisLabelYFromUser ::axisLabelY])
                              ))

(s/form ::aggregation.bar/query)

(defmethod vis "area"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "bar"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "line"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "polararea"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "donut"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "pivot table"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "scatter"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "bubble"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(defmethod vis "map"  [_]
  (s/merge ::base-viz #_(s/keys :req-un [::area.s/spec])))

(s/fdef visualisation/create
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :body ::visualisation
	 :jwt-claims map?)
  :ret any?)

(s/fdef visualisation/upsert
  :args (s/cat
         :db-query-service ::protocols.s/db-query-service
	 :body ::visualisation
	 :jwt-claims map?)
  :ret any?)
