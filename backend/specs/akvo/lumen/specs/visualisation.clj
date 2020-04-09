(ns akvo.lumen.specs.visualisation
  (:require [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.aggregation.bar :as aggregation.bar]
            [akvo.lumen.lib.aggregation.bubble :as aggregation.bubble]
            [akvo.lumen.lib.aggregation.line :as aggregation.line]
            [akvo.lumen.lib.aggregation.pie :as aggregation.pie]
            [akvo.lumen.lib.aggregation.pivot :as aggregation.pivot]
            [akvo.lumen.lib.aggregation.scatter :as aggregation.scatter]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.aggregation :as aggregation.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.db.dataset-version :as db.dsv.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [akvo.lumen.specs.protocols :as protocols.s]
            [akvo.lumen.specs.visualisation.maps :as visualisation.maps.s]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]))

(s/def ::name string?)
(s/def ::visualisationType #{"pie" "area" "bar" "line" "polararea" "donut" "pivot table" "scatter" "bubble" "map"})
(s/def ::type #{"visualisation"})
(s/def ::created ::lumen.s/date-number)
(s/def ::modified ::lumen.s/date-number)
(s/def ::datasetId (s/nilable ::db.dsv.s/dataset-id))
(s/def ::status #{"OK"})

(def ^:dynamic *id?*  lumen.s/str-uuid?)

(s/def ::id? #'*id?*)

(s/def ::id  (s/with-gen
               ::id?
               lumen.s/str-uuid-gen))

(s/def ::version int?)
(s/def ::sort any?)
(s/def ::showLegend (s/nilable boolean?))
(s/def ::showLabels (s/nilable boolean?))
(s/def ::legendPosition (s/nilable #{"right" "top" "left" "bottom"}))
(s/def ::legendTitle (s/nilable string?))

(defmulti vis :visualisationType)

(s/def ::visualisation
  (s/multi-spec vis :visualisationType))

(s/def ::visualisations (s/coll-of ::visualisation :distinct true))

(s/def ::base-spec (s/keys :req-un [::version]
                           :opt-un [::postgres.filter/filters ::legendTitle ::showLegend ::sort
                                    ::showLabels ::legendPosition]))

(s/def ::base-viz (s/keys :req-un [::name ::visualisationType ::datasetId]
                          :opt-un [::created ::modified ::id ::type]))

(create-ns  'akvo.lumen.specs.visualisation.pie)
(alias 'pie.s 'akvo.lumen.specs.visualisation.pie)
(s/def ::pie.s/bucketColumn ::db.dsv.column.s/columnName)
(s/def ::pie.s/spec (s/merge
                     (s/keys :req-un [::pie.s/bucketColumn])
                     ::base-spec))

(defmethod vis "pie"  [_]
  (s/merge ::base-viz (s/keys :req-un [::pie.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.donut)
(alias 'donut.s 'akvo.lumen.specs.visualisation.donut)

(s/def ::donut.s/bucketColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::donut.s/spec (s/merge
                     (s/keys :req-un [::donut.s/bucketColumn])
                     ::base-spec))

(defmethod vis "donut"  [_]
  (s/merge ::base-viz (s/keys :req-un [::donut.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.polar)
(alias 'polar.s 'akvo.lumen.specs.visualisation.polar)
(s/def ::polar.s/bucketColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::polar.s/spec (s/merge
                     (s/keys :req-un [::polar.s/bucketColumn])
                     ::base-spec))

(defmethod vis "polararea"  [_]
  (s/merge ::base-viz (s/keys :req-un [::polar.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.area)
(alias 'area.s 'akvo.lumen.specs.visualisation.area)

(s/def ::axisLabelXFromUser boolean?)
(s/def ::axisLabelX (s/nilable string?))
(s/def ::axisLabelYFromUser boolean?)
(s/def ::axisLabelY (s/nilable string?))
(s/def ::area.s/metricColumnX (s/nilable ::db.dsv.column.s/columnName))
(s/def ::area.s/metricColumnY (s/nilable ::db.dsv.column.s/columnName))
(s/def ::bucketColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::area.s/metricAggregation (s/nilable ::aggregation.s/metricAggregation))
(s/def ::area.s/spec (s/merge ::base-spec
                              (s/keys :req-un [::area.s/metricColumnY ::area.s/metricColumnX
                                               ::area.s/metricAggregation
                                               ::axisLabelXFromUser ::axisLabelX
                                               ::axisLabelYFromUser ::axisLabelY])))

(defmethod vis "area"  [_]
  (s/merge ::base-viz (s/keys :req-un [::area.s/spec])))

(defmethod vis "line"  [_]
  (s/merge ::base-viz (s/keys :req-un [::area.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.scatter)
(alias 'scatter.s 'akvo.lumen.specs.visualisation.scatter)

(s/def ::bucketColumnCategory (s/nilable ::db.dsv.column.s/columnName))
(s/def ::datapointLabelColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::metricColumnSize (s/nilable ::db.dsv.column.s/columnName))


(s/def ::categoryLabel (s/nilable string?))
(s/def ::sizeLabel (s/nilable string?))
(s/def ::categoryLabelFromUser (s/nilable string?))
(s/def ::sizeLabelFromUser boolean?)
(s/def ::scatter.s/metricColumnY (s/nilable ::db.dsv.column.s/columnName))
(s/def ::scatter.s/metricColumnX (s/nilable ::db.dsv.column.s/columnName))
(s/def ::scatter.s/spec (s/merge ::base-spec
                                 (s/keys :req-un [::datapointLabelColumn
                                                  ::scatter.s/metricColumnY ::scatter.s/metricColumnX
                                                  ::bucketColumn
                                                  ::aggregation.s/metricAggregation
                                                  ::axisLabelXFromUser ::axisLabelX
                                                  ::axisLabelYFromUser ::axisLabelY
                                                  ]
                                         :opt-un [::metricColumnSize
                                                  ::bucketColumnCategory
                                                  ::sizeLabelFromUser
                                                  ::categoryLabelFromUser
                                                  ::categoryLabel
                                                  ::sizeLabel])))

(defmethod vis "scatter"  [_]
  (s/merge ::base-viz (s/keys :req-un [::scatter.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.bubble)
(alias 'bubble.s 'akvo.lumen.specs.visualisation.bubble)

(s/def ::metricLabelFromUser boolean?)
(s/def ::bucketLabel (s/nilable string?))
(s/def ::metricLabel (s/nilable string?))
(s/def ::metricColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::truncateSize (s/nilable string?))

(s/def ::bubble.s/spec (s/merge ::base-spec
                                (s/keys :req-un [::metricLabelFromUser
                                                 ::bucketLabel
                                                 ::aggregation.s/metricAggregation
                                                 ::bucketColumn
                                                 ::metricLabel
                                                 ::metricColumn
                                                 ::truncateSize])))

(defmethod vis "bubble"  [_]
  (s/merge ::base-viz (s/keys :req-un [::bubble.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.pivot)
(alias 'pivot.s 'akvo.lumen.specs.visualisation.pivot)

(s/def ::hideColumnTotals boolean?)
(s/def ::hideRowTotals boolean?)
(s/def ::rowColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::decimalPlaces pos-int?)
(s/def ::rowTitle (s/nilable string?))
(s/def ::valueDisplay (s/nilable string?))
(s/def ::pivot.s/aggregation ::aggregation.s/metricAggregation)
(s/def ::valueColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::categoryColumn (s/nilable ::db.dsv.column.s/columnName))

(s/def ::categoryTitle (s/nilable string?))
(s/def ::pivot.s/spec (s/merge ::base-spec
                               (s/keys :req-un [::rowColumn
                                                ::decimalPlaces
                                                ::rowTitle
                                                ::pivot.s/aggregation
                                                ::valueColumn
                                                ::valueDisplay
                                                ::categoryColumn
                                                ::categoryTitle]
                                       :opt-un [::hideColumnTotals
                                                ::hideRowTotals])))

(defmethod vis "pivot table"  [_]
  (s/merge ::base-viz (s/keys :req-un [::pivot.s/spec])))

(create-ns  'akvo.lumen.specs.visualisation.bar)
(alias 'bar.s 'akvo.lumen.specs.visualisation.bar)
(s/def ::subBucketColumn (s/nilable ::db.dsv.column.s/columnName))

(s/def ::metricColumnsY (s/coll-of ::db.dsv.column.s/columnName :distinct true))
(s/def ::bar.s/metricColumnY (s/nilable ::db.dsv.column.s/columnName))
(s/def ::bar.s/metricColumnX (s/nilable ::db.dsv.column.s/columnName))
(s/def ::horizontal boolean?)
(s/def ::showValueLabels boolean?)

(s/def ::subBucketMethod #{"split" "stack" "stack_percentage"})
(s/def ::bar.s/spec (s/merge ::base-spec
                             (s/keys :req-un [::subBucketColumn
                                              ::aggregation.s/metricAggregation
                                              ::axisLabelXFromUser ::axisLabelX
                                              ::axisLabelYFromUser ::axisLabelY
                                              ::bar.s/metricColumnX
                                              ::bar.s/metricColumnY
                                              ::bucketColumn
                                              ::subBucketMethod
                                              ::truncateSize]
                                     :opt-un [::showValueLabels
                                              ::metricColumnsY
                                              ::horizontal]
                                     )))

(defmethod vis "bar"  [_]
  (s/merge ::base-viz (s/keys :req-un [::bar.s/spec])))


(create-ns  'akvo.lumen.specs.visualisation.map)
(alias 'map.s 'akvo.lumen.specs.visualisation.map)

(s/def ::map.s/baseLayer #{"street" "satellite" "terrain"})

(s/def ::map.s/spec
  (s/keys :req-un [::version ::map.s/baseLayer ::visualisation.maps.s/layers]))

(defmethod vis "map"  [_]
  (s/merge ::base-viz (s/keys :req-un [::map.s/spec])) )

#_(s/fdef visualisation/create
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :body ::visualisation
	 :jwt-claims map?)
  :ret any?)

#_(s/fdef visualisation/upsert
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :body ::visualisation
	 :jwt-claims map?)
  :ret any?)
