(ns akvo.lumen.specs.aggregation
  (:require [akvo.lumen.component.tenant-manager :as tenant-manager]
	    [akvo.lumen.lib :as lib]
	    [akvo.lumen.lib.aggregation :as lib.aggregation]
	    [akvo.lumen.lib.aggregation.bar :as l.aggregation.bar]
	    [akvo.lumen.lib.aggregation.filter :as l.aggregation.filter]
	    [akvo.lumen.lib.aggregation.line :as l.aggregation.line]
	    [akvo.lumen.lib.aggregation.pie :as l.aggregation.pie]
            [akvo.lumen.lib.aggregation.pivot :as l.aggregation.pivot]
	    [akvo.lumen.lib.aggregation.scatter :as l.aggregation.scatter]
	    [akvo.lumen.lib.aggregation.utils :as l.aggregation.utils]
	    [akvo.lumen.specs.aggregation.pivot.row :as a.pivot.row.s]
	    [akvo.lumen.specs.aggregation.query :as aggregation.query.s]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.dataset.column :as dataset.column.s]
	    [akvo.lumen.specs.db :as db.s]
	    [akvo.lumen.specs.libs]
	    [clojure.spec.alpha :as s]))

(s/def ::l.aggregation.filter/filter (s/keys :req-un [::aggregation.query.s/operation
                                                      ::aggregation.query.s/strategy
                                                      ::aggregation.query.s/value
                                                      ::dataset.s/column]))


(s/def ::l.aggregation.filter/categoryColumn ::dataset.s/column)
(s/def ::l.aggregation.filter/rowColumn ::dataset.s/column)
(s/def ::l.aggregation.filter/valueColumn ::dataset.s/column)
(s/def ::l.aggregation.filter/aggregation string?)

(s/def ::l.aggregation.filter/filters (s/coll-of ::l.aggregation.filter/filter :gen-max 3))

(s/fdef l.aggregation.filter/sql-str
  :args (s/cat
         :columns ::dataset.s/columns
	 :filters ::aggregation.query.s/filters)
  :ret string?)

(s/fdef l.aggregation.filter/find-column
  :args (s/cat
         :columns ::dataset.s/columns
	 :column-name string?)
  :ret ::dataset.s/column)

(s/fdef l.aggregation.filter/filter-sql
  :args (s/cat
         :filter ::l.aggregation.filter/filter)
  :ret string?)


(s/def ::l.aggregation.filter/comparison-op #{">" "<="})

(s/fdef l.aggregation.filter/comparison
  :args (s/cat
         :op ::l.aggregation.filter/comparison-op
         :column-type ::dataset.column.s/type
         :column-name ::dataset.column.s/columnName
         :value ::aggregation.query.s/value)
  :ret string?)

(s/fdef l.aggregation.utils/find-column
  :args (s/cat :columns ::dataset.s/columns
               :column-name ::lumen.s/string-nullable)
  :ret ::dataset.s/column)

(s/def ::l.aggregation.pivot/category-column ::dataset.s/column)
(s/def ::l.aggregation.pivot/row-column ::dataset.s/column)
(s/def ::l.aggregation.pivot/value-column ::dataset.s/column)
(s/def ::l.aggregation.pivot/aggregation #{"avg" "sum" "min" "max" "count"})

(s/def ::l.aggregation.pivot/query
  (s/keys :req-un [::aggregation.query.s/aggregation]
	  :opt-un [::aggregation.query.s/filters
		   ::aggregation.query.s/categoryColumn
		   ::aggregation.query.s/rowColumn
		   ::aggregation.query.s/valueColumn]))

(s/def ::l.aggregation.pivot/query-built
  (s/keys :req-un [::l.aggregation.pivot/aggregation]
          :opt-un [::l.aggregation.pivot/category-column
                   ::aggregation.query.s/filters
                   ::l.aggregation.pivot/row-column
                   ::l.aggregation.pivot/value-column]))

(s/fdef l.aggregation.pivot/build-query
  :args (s/cat
	 :columns ::dataset.s/columns
	 :query ::l.aggregation.pivot/query)
  :ret ::l.aggregation.pivot/query-built)


(s/def ::l.aggregation.pivot/row (s/keys :req-un [::a.pivot.row.s/type ::a.pivot.row.s/title]))

(s/def ::l.aggregation.pivot/rows (s/coll-of ::l.aggregation.pivot/row :gen-max 3))

(s/def ::l.aggregation.pivot/columns integer?)

(s/def ::l.aggregation.pivot/apply-query-ret
  (s/keys :req-un [::l.aggregation.pivot/rows
                   ::l.aggregation.pivot/columns]))

(s/fdef l.aggregation.pivot/apply-query
  :args (s/cat
         :conn ::db.s/tenant-connection
         :dataset ::dataset.s/dataset
         :query ::l.aggregation.pivot/query-built
         :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-pivot
  :args (s/cat
         :conn ::db.s/tenant-connection
         :dataset ::dataset.s/dataset
         :query ::l.aggregation.pivot/query-built
         :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-query
  :args (s/cat
         :conn ::db.s/tenant-connection
         :dataset ::dataset.s/dataset
         :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-category-query
  :args (s/cat
         :conn ::db.s/tenant-connection
         :dataset ::dataset.s/dataset
         :query ::l.aggregation.pivot/query-built
         :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-row-query
  :args (s/cat
         :conn ::db.s/tenant-connection
         :dataset ::dataset.s/dataset
         :query ::l.aggregation.pivot/query-built
         :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/fdef l.aggregation.pivot/apply-empty-value-query
  :args (s/cat
         :conn ::db.s/tenant-connection
         :dataset ::dataset.s/dataset
         :query ::l.aggregation.pivot/query-built
         :filter-str string?)
  :ret ::l.aggregation.pivot/apply-query-ret)

(s/def ::l.aggregation.pie/bucketColumn ::aggregation.query.s/column)
(s/def ::l.aggregation.pie/query (s/keys :req-un [::l.aggregation.pie/bucketColumn]
                                         :opt-un [::aggregation.query.s/filters]))

(s/def ::lib.aggregation/metricAggregation #{nil
                                             "mean"
                                             "median"
                                             "distinct"
                                             "q1"
                                             "q3"
                                             '("min" "max" "count" "sum") ;; check this seq values
                                             })

(s/def ::l.aggregation.line/metricAggregation ::lib.aggregation/metricAggregation) 
(s/def ::l.aggregation.line/metricColumnX ::aggregation.query.s/column)
(s/def ::l.aggregation.line/metricColumnY ::aggregation.query.s/column)
(s/def ::l.aggregation.line/query (s/keys :req-un [::l.aggregation.line/metricColumnX
                                                   ::l.aggregation.line/metricColumnY]
                                          :opt-un [::aggregation.query.s/filters
                                                   ::l.aggregation.line/metricAggregation]))

(s/def ::l.aggregation.scatter/metricAggregation ::lib.aggregation/metricAggregation) 
(s/def ::l.aggregation.scatter/metricColumnX ::aggregation.query.s/column)
(s/def ::l.aggregation.scatter/metricColumnY ::aggregation.query.s/column)
(s/def ::l.aggregation.scatter/datapointLabelColumn ::aggregation.query.s/column)
(s/def ::l.aggregation.scatter/bucketColumn ::aggregation.query.s/column)

(s/def ::l.aggregation.scatter/query (s/keys :req-un [::l.aggregation.scatter/metricColumnX
                                                      ::l.aggregation.scatter/metricColumnY
                                                      ::l.aggregation.scatter/datapointLabelColumn
                                                      ::l.aggregation.scatter/bucketColumn]
                                             :opt-un [::aggregation.query.s/filters
                                                      ::l.aggregation.scatter/metricAggregation]))


(s/def ::l.aggregation.bar/bucketColumn ::aggregation.query.s/column)
(s/def ::l.aggregation.bar/metricColumnY ::aggregation.query.s/column)
(s/def ::l.aggregation.bar/subBucketColumn ::aggregation.query.s/column)
(s/def ::l.aggregation.bar/sort (s/or :v ::db.s/sort :n nil?))
(s/def ::l.aggregation.bar/metricAggregation ::lib.aggregation/metricAggregation)
(s/def ::l.aggregation.bar/truncateSize string?) 
(s/def ::l.aggregation.bar/query
  (s/keys :req-un [::l.aggregation.bar/bucketColumn
                   ::l.aggregation.bar/metricColumnY
                   ::l.aggregation.bar/metricAggregation
                   ::l.aggregation.bar/sort
                   ::l.aggregation.bar/subBucketColumn] ;; check if it could be nil
          :opt-un [::aggregation.query.s/filters
                   ::l.aggregation.bar/truncateSize]))

(s/def ::lib.aggregation/visualisation-type #{"pivot" "pie" "donut" "line" "bar" "scatter"})

(defmulti query-type ::lib.aggregation/visualisation-type)

(defmethod query-type "pivot" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset.s/dataset]
	  :req-un[::l.aggregation.pivot/query]))

(defmethod query-type "pie" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset.s/dataset]
	  :req-un[::l.aggregation.pie/query]))

(defmethod query-type "line" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset.s/dataset]
	  :req-un[::l.aggregation.line/query]))

(defmethod query-type "bar" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset.s/dataset]
	  :req-un[::l.aggregation.bar/query]))

(defmethod query-type "donut" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset.s/dataset]
	  :req-un[::l.aggregation.pie/query]))

(defmethod query-type "scatter" [_]
  (s/keys :req [::db.s/tenant-connection
		::dataset.s/dataset]
	  :req-un[::l.aggregation.scatter/query]))


(s/fdef lib.aggregation/query
  :args (s/cat
	 :tenant-connection ::db.s/tenant-connection
	 :dataset-id ::dataset.s/id
	 :visualisation-type ::lib.aggregation/visualisation-type
	 :query ::lumen.s/any)
  :ret ::lib/response)

(s/fdef l.aggregation.pie/query
  :args (s/cat
	 :tenant-connection ::db.s/tenant-connection
	 :dataset ::dataset.s/dataset
	 :query ::l.aggregation.pie/query)
  :ret ::lib/response)

(s/fdef l.aggregation.pivot/query
  :args (s/cat
	 :tenant-connection ::db.s/tenant-connection
	 :dataset ::dataset.s/dataset
	 :query ::l.aggregation.pivot/query)
  :ret ::lib/response)

(s/fdef lib.aggregation/query*
  :args (s/cat :args (s/multi-spec query-type ::lib.aggregation/visualisation-type))
  :ret ::lib/response)
