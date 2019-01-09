(ns akvo.lumen.specs.aggregation
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.aggregation.pie :as aggregation.pie]
            [akvo.lumen.lib.aggregation.pivot :as aggregation.pivot]
            [akvo.lumen.lib.aggregation.bar :as aggregation.bar]
            [akvo.lumen.lib.aggregation.bubble :as aggregation.bubble]
            [akvo.lumen.postgres.filter :as postgres.filter]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.util :as u]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(create-ns  'akvo.lumen.specs.aggregation.query)
(alias 'aggregation.query.s 'akvo.lumen.specs.aggregation.query)

(alias 'db.dsv.column 'akvo.lumen.specs.db.dataset-version.column)
(alias 'db.dsv 'akvo.lumen.specs.db.dataset-version)

(s/def ::aggregation/dataset (s/keys :req-un [::db.dsv/columns ::db.dsv/table-name]))
(s/def ::aggregation.pie/bucketColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pie/query (s/keys :req-un [::postgres.filter/filters
                                                ::aggregation.pie/bucketColumn]))

(s/fdef aggregation.pie/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.pie/query)
  :ret any?)

(s/def ::aggregation.pivot/categoryColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pivot/rowColumn ::db.dsv.column/columnName)
(s/def ::aggregation.pivot/valueColumn ::db.dsv.column/columnName)
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

(s/def ::aggregation.bar/bucketColumn ::db.dsv.column/columnName)
(s/def ::aggregation.bar/subBucketColumn (s/nilable ::db.dsv.column/columnName))
(s/def ::aggregation.bar/metricColumnY (s/nilable ::db.dsv.column/columnName))
(s/def ::aggregation.bar/metricAggregation #{"mean"
                                             "sum"
                                             "min"
                                             "max"
                                             "count"
                                             "median"
                                             "distinct"
                                             "q1"
                                             "q3"})
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

(s/def ::aggregation.bubble/bucketColumn (s/nilable ::db.dsv.column/columnName))
(s/def ::aggregation.bubble/metricColumn (s/nilable ::db.dsv.column/columnName))
(s/def ::aggregation.bubble/metricAggregation ::aggregation.bar/metricAggregation)

(s/def ::aggregation.bubble/query (s/keys :req-un [::postgres.filter/filters
                                                   ::aggregation.bubble/bucketColumn]
                                          :opt-un [::aggregation.bubble/metricAggregation
                                                   ::aggregation.bubble/metricColumn]))


(s/fdef aggregation.bubble/query
  :args (s/cat
         :db-conn ::db.s/tenant-connection
	 :dataset ::aggregation/dataset
	 :query ::aggregation.bubble/query)
  :ret any?)

