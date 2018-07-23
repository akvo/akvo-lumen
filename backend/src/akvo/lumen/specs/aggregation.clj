(ns akvo.lumen.specs.aggregation
  (:require [akvo.lumen.dataset :as dataset]
            [akvo.lumen.dataset.utils :as dataset.utils]
	    [akvo.lumen.lib :as lib]
	    [akvo.lumen.lib.aggregation :as lib.aggregation]
	    [akvo.lumen.lib.aggregation.bar :as l.aggregation.bar]
	    [akvo.lumen.lib.aggregation.line :as l.aggregation.line]
	    [akvo.lumen.lib.aggregation.pie :as l.aggregation.pie]
	    [akvo.lumen.lib.aggregation.pivot :as l.aggregation.pivot]
            [akvo.lumen.lib.aggregation.scatter :as l.aggregation.scatter]
	    [akvo.lumen.postgres.filter :as postgres.filter]
	    [akvo.lumen.specs.aggregation.pivot.row :as a.pivot.row.s]
	    [akvo.lumen.specs.aggregation.query :as aggregation.query.s]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.dataset.column :as dataset.column.s]
	    [akvo.lumen.specs.db :as db.s]
	    [akvo.lumen.specs.libs]
	    [akvo.lumen.specs.postgres]
	    [clojure.spec.alpha :as s]))

(s/def ::l.aggregation.pivot/category-column ::dataset/column)

(s/def ::l.aggregation.pivot/row-column ::dataset/column)

(s/def ::l.aggregation.pivot/value-column ::dataset/column)

(s/def ::l.aggregation.pivot/aggregation #{"avg" "sum" "min" "max" "count"})

(s/def ::l.aggregation.pivot/categoryColumn ::aggregation.query.s/nullable-column)

(s/def ::l.aggregation.pivot/rowColumn ::aggregation.query.s/nullable-column)

(s/def ::l.aggregation.pivot/valueColumn ::aggregation.query.s/nullable-column)

(s/def ::l.aggregation.pivot/query
  (s/keys :req-un [::aggregation.query.s/aggregation]
	  :opt-un [::postgres.filter/filters
		   ::l.aggregation.pivot/categoryColumn
		   ::l.aggregation.pivot/rowColumn
		   ::l.aggregation.pivot/valueColumn]))

(s/def ::l.aggregation.pivot/query-built
  (s/keys :req-un [::l.aggregation.pivot/aggregation]
          :opt-un [::l.aggregation.pivot/category-column
                   ::postgres.filter/filters
                   ::l.aggregation.pivot/row-column
                   ::l.aggregation.pivot/value-column]))

(s/def ::l.aggregation.pivot/row (s/keys :req-un [::a.pivot.row.s/type ::a.pivot.row.s/title]))

(s/def ::l.aggregation.pivot/rows (s/coll-of ::l.aggregation.pivot/row :gen-max 3))

(s/def ::l.aggregation.pivot/columns pos-int?)

(s/def ::l.aggregation.pivot/apply-query-ret
  (s/keys :req-un [::l.aggregation.pivot/rows
                   ::l.aggregation.pivot/columns]))

(s/def ::l.aggregation.pie/bucketColumn ::aggregation.query.s/column)

(s/def ::l.aggregation.pie/query (s/keys :req-un [::l.aggregation.pie/bucketColumn]
                                         :opt-un [::postgres.filter/filters]))

(s/fdef l.aggregation.pivot/build-query
  :args (s/cat
	 :columns ::dataset/columns
	 :query ::l.aggregation.pivot/query)
  :ret ::l.aggregation.pivot/query-built)

(s/fdef l.aggregation.pivot/apply-query
  :args (s/cat
	 :conn ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pivot/query-built
	 :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-pivot
  :args (s/cat
	 :conn ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pivot/query-built
	 :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-query
  :args (s/cat
	 :conn ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-category-query
  :args (s/cat
	 :conn ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pivot/query-built
	 :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-row-query
  :args (s/cat
	 :conn ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pivot/query-built
	 :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-value-query
  :args (s/cat
	 :conn ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pivot/query-built
	 :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/def ::lib.aggregation/metricAggregation (s/or :opts1 #{"mean"
                                                          "median"
                                                          "distinct"
                                                          "q1"
                                                          "q3"}
                                                 :opts2 #{"min" "max" "count" "sum"}
                                                 :nil nil?))

(s/def ::l.aggregation.line/metricAggregation ::lib.aggregation/metricAggregation) 
(s/def ::l.aggregation.line/metricColumnX ::aggregation.query.s/column)
(s/def ::l.aggregation.line/metricColumnY ::aggregation.query.s/column)
(s/def ::l.aggregation.line/query (s/keys :req-un [::l.aggregation.line/metricColumnX
                                                   ::l.aggregation.line/metricColumnY]
                                          :opt-un [::postgres.filter/filters
                                                   ::l.aggregation.line/metricAggregation]))

(s/def ::l.aggregation.scatter/metricAggregation ::lib.aggregation/metricAggregation) 
(s/def ::l.aggregation.scatter/metricColumnX ::aggregation.query.s/column)
(s/def ::l.aggregation.scatter/metricColumnY ::aggregation.query.s/column)
(s/def ::l.aggregation.scatter/datapointLabelColumn ::aggregation.query.s/nullable-column)
(s/def ::l.aggregation.scatter/bucketColumn ::aggregation.query.s/nullable-column)

(s/def ::l.aggregation.scatter/query (s/keys :req-un [::l.aggregation.scatter/metricColumnX
                                                      ::l.aggregation.scatter/metricColumnY
                                                      ::l.aggregation.scatter/datapointLabelColumn]
                                             :opt-un [::postgres.filter/filters
                                                      ::l.aggregation.scatter/metricAggregation
                                                      ::l.aggregation.scatter/bucketColumn]))


(s/def ::l.aggregation.bar/bucketColumn ::aggregation.query.s/column)
(s/def ::l.aggregation.bar/metricColumnY ::aggregation.query.s/column)
(s/def ::l.aggregation.bar/subBucketColumn ::aggregation.query.s/nullable-column)
(s/def ::l.aggregation.bar/sort (s/or :v ::db.s/sort :n nil?))
(s/def ::l.aggregation.bar/metricAggregation ::lib.aggregation/metricAggregation)
(s/def ::l.aggregation.bar/truncateSize (s/or :s string?
                                              :n nil?)) 
(s/def ::l.aggregation.bar/query
  (s/keys :req-un [::l.aggregation.bar/bucketColumn
                   ::l.aggregation.bar/metricColumnY
                   ::l.aggregation.bar/subBucketColumn] ;; check if it could be nil
          :opt-un [::aggregation.query.s/filters
                   ::l.aggregation.bar/sort
                   ::l.aggregation.bar/metricAggregation
                   ::l.aggregation.bar/truncateSize]))

(s/def ::lib.aggregation/visualisation-type #{"pivot" "pie" "donut" "line" "bar" "scatter"})

(defmulti query-type ::lib.aggregation/visualisation-type)

(defmethod query-type "pivot" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset/dataset]
	  :req-un[::l.aggregation.pivot/query]))

(defmethod query-type "pie" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset/dataset]
	  :req-un[::l.aggregation.pie/query]))

(defmethod query-type "line" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset/dataset]
	  :req-un[::l.aggregation.line/query]))

(defmethod query-type "bar" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset/dataset]
	  :req-un[::l.aggregation.bar/query]))

(defmethod query-type "donut" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset/dataset]
	  :req-un[::l.aggregation.pie/query]))

(defmethod query-type "scatter" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset/dataset]
	  :req-un[::l.aggregation.scatter/query]))

(s/fdef lib.aggregation/query*
  :args (s/cat :args (s/multi-spec query-type ::lib.aggregation/visualisation-type))
  :ret ::lib/response)

(s/fdef lib.aggregation/query
  :args (s/cat
	 :tenant-connection ::db.s/tenant-connection
	 :dataset-id ::dataset/id
	 :visualisation-type ::lib.aggregation/visualisation-type
	 :query ::lumen.s/any)
  :ret ::lib/response)

(s/fdef l.aggregation.pie/query
  :args (s/cat
	 :tenant-connection ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pie/query)
  :ret ::lib/response)

(s/fdef l.aggregation.pivot/query
  :args (s/cat
	 :tenant-connection ::db.s/tenant-connection
	 :dataset ::dataset/dataset
	 :query ::l.aggregation.pivot/query)
  :ret ::lib/response)

