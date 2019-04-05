(ns akvo.lumen.specs.aggregation
  (:require [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.aggregation.bar :as aggregation.bar]
            [akvo.lumen.lib.aggregation.bubble :as aggregation.bubble]
            [akvo.lumen.lib.aggregation.line :as aggregation.line]
            [akvo.lumen.lib.aggregation.pie :as aggregation.pie]
            [akvo.lumen.lib.aggregation.pivot :as aggregation.pivot]
            [akvo.lumen.lib.aggregation.scatter :as aggregation.scatter]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.db.dataset-version :as db.dsv.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [clojure.spec.alpha :as s]))

(s/def ::aggregation/dataset (s/keys :req-un [::db.dsv.s/columns ::db.dsv.s/table-name]))
(s/def ::aggregation.pie/bucketColumn ::db.dsv.column.s/columnName)
(s/def ::aggregation.pie/query (s/keys :req-un [::postgres.filter/filters
                                                ::aggregation.pie/bucketColumn]))

(s/fdef aggregation.pie/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.pie/query)
  :ret any?)

(s/def ::aggregation.pivot/categoryColumn (s/nilable ::db.dsv.column.s/columnName)) ;; todo should be fixed in client side?
(s/def ::aggregation.pivot/rowColumn (s/nilable ::db.dsv.column.s/columnName)) ;; todo should be fixed in client side?
(s/def ::aggregation.pivot/valueColumn (s/nilable ::db.dsv.column.s/columnName)) ;; todo should be fixed in client side?
(s/def ::aggregation.pivot/aggregation #{"mean"
                                         "sum"
                                         "min"
                                         "max"
                                         "count"})

(s/def ::aggregation.pivot/query (s/keys :req-un [::postgres.filter/filters
                                                  ::aggregation.pivot/aggregation]
                                         :opt-un [::aggregation.pivot/rowColumn
                                                  ::aggregation.pivot/valueColumn
                                                  ::aggregation.pivot/categoryColumn]))

(s/fdef aggregation.pivot/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.pivot/query)
  :ret any?)

(s/def ::aggregation.bar/bucketColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.bar/subBucketColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.bar/metricColumnY (s/nilable ::db.dsv.column.s/columnName))
(s/def ::metricAggregation #{"mean"
                             "sum"
                             "min"
                             "max"
                             "count"
                             "median"
                             "distinct"
                             "q1"
                             "q3"})
(s/def ::aggregation.bar/metricAggregation (s/nilable ::metricAggregation))
(s/def ::aggregation.bar/sort (s/nilable #{"asc" "dsc"}))
(s/def ::aggregation.bar/truncateSize (s/nilable string?))

(s/def ::aggregation.bar/query (s/keys :req-un [::postgres.filter/filters
                                                ::aggregation.bar/bucketColumn]
                                       :opt-un [::aggregation.bar/subBucketColumn
                                                ::aggregation.bar/metricColumnY
                                                ::aggregation.bar/sort
                                                ::aggregation.bar/truncateSize]))

(s/fdef aggregation.bar/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.bar/query)
  :ret any?)

(s/def ::aggregation.bubble/bucketColumn ::db.dsv.column.s/columnName)
(s/def ::aggregation.bubble/metricColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.bubble/metricAggregation (s/nilable ::metricAggregation))

(s/def ::aggregation.bubble/query (s/keys :req-un [::postgres.filter/filters
                                                   ::aggregation.bubble/bucketColumn
                                                   ::aggregation.bubble/metricColumn
                                                   ::aggregation.bubble/metricAggregation]))

(s/fdef aggregation.bubble/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.bubble/query)
  :ret any?)

(s/def ::aggregation.line/metricColumnX ::db.dsv.column.s/columnName)
(s/def ::aggregation.line/metricColumnY ::db.dsv.column.s/columnName)
(s/def ::aggregation.line/metricAggregation (s/nilable ::metricAggregation))

(s/def ::aggregation.line/query (s/keys :req-un [::postgres.filter/filters
                                                 ::aggregation.line/metricColumnX
                                                 ::aggregation.line/metricColumnY]
                                        :opt-un [::aggregation.line/metricAggregation]))

(s/fdef aggregation.line/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.line/query)
  :ret any?)

(s/def ::aggregation.scatter/metricColumnX ::db.dsv.column.s/columnName)
(s/def ::aggregation.scatter/metricColumnY ::db.dsv.column.s/columnName)
(s/def ::aggregation.scatter/metricColumnSize (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.scatter/bucketColumnCategory (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.scatter/datapointLabelColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.scatter/bucketColumn (s/nilable ::db.dsv.column.s/columnName))
(s/def ::aggregation.scatter/metricAggregation (s/nilable ::metricAggregation))

(s/def ::aggregation.scatter/query (s/keys :req-un [::postgres.filter/filters
                                                    ::aggregation.scatter/metricAggregation
                                                    ::aggregation.scatter/metricColumnX
                                                    ::aggregation.scatter/metricColumnY]
                                           :opt-un [::aggregation.scatter/bucketColumn
                                                    ::aggregation.scatter/metricColumnSize
                                                    ::aggregation.scatter/datapointLabelColumn
                                                    ::aggregation.scatter/bucketColumnCategory]))

(s/fdef aggregation.scatter/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.scatter/query)
  :ret any?)
