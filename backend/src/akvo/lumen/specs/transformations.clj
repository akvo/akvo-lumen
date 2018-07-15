(ns akvo.lumen.specs.transformations
  (:require [akvo.lumen.lib :as lib]
	    [akvo.lumen.lib.dataset :as lib.dataset]
	    [akvo.lumen.specs.core :as lumen.s]
	    [akvo.lumen.specs.dataset :as dataset.s]
	    [akvo.lumen.specs.dataset.column :as dataset.column.s]
	    [akvo.lumen.specs.db :as db.s]
	    [akvo.lumen.specs.libs]
	    [akvo.lumen.specs.transformations.merge-dataset.source :as t.merge-dataset.source.s]
	    [akvo.lumen.specs.transformations.merge-dataset.target :as t.merge-dataset.target.s]
	    [akvo.lumen.specs.transformations.remove-sort :as transformations.remove-sort.s]
	    [akvo.lumen.specs.transformations.text :as transformations.text.s]
	    [akvo.lumen.transformation :as transformation]
	    [akvo.lumen.transformation.change-datatype :as transformation.change-datatype]
	    [akvo.lumen.transformation.combine :as transformation.combine]
	    [akvo.lumen.transformation.delete-column :as transformation.delete-column]
	    [akvo.lumen.transformation.derive :as transformation.derive]
	    [akvo.lumen.transformation.derive.js-engine :as t.derive.js-engine]
	    [akvo.lumen.transformation.engine :as transformation.engine]
	    [akvo.lumen.transformation.filter-column :as transformation.filter-column]
	    [akvo.lumen.transformation.geo :as transformation.geo]
	    [akvo.lumen.transformation.merge-datasets :as transformation.merge-datasets]
	    [akvo.lumen.transformation.rename-column :as transformation.rename-column]
	    [akvo.lumen.transformation.reverse-geocode :as transformation.reverse-geocode]
	    [akvo.lumen.transformation.sort-column :as transformation.sort-column]
	    [clojure.spec.alpha :as s]))

(s/def ::transformation.engine/js-value-types #{"number" "text" "date"})
(s/def ::transformation.engine/onError #{"leave-empty" "fail" "delete-row" "default-value"})
(s/def ::transformation.engine/op #{"core/change-datatype"
				    "core/combine"
				    "core/delete-column"
				    "core/derive"
				    "core/filter-column"
				    "core/generate-geopoints"
				    "core/merge-datasets"
				    "core/remove-sort"
				    "core/rename-column"
				    "core/reverse-geocode"
				    "core/sort-column"
				    "core/to-lowercase"
				    "core/to-titlecase"
				    "core/to-uppercase"
				    "core/trim"
				    "core/trim-doublespace"})

(defmulti op-spec ::transformation.engine/op)

(s/def ::transformation.change-datatype/newType ::dataset.column.s/type)
(s/def ::transformation.change-datatype/parseFormat string?) ;; TODO: review it
(s/def ::transformation.change-datatype/args
  (s/keys :req-un [::dataset.column.s/columnName
		   ::transformation.change-datatype/newType]
	  :opt-un [::transformation.change-datatype/parseFormat]))
(defmethod op-spec "core/change-datatype"  [_]
  (s/keys
   :req-un [::transformation.change-datatype/args
	    ::transformation.engine/onError]))

(s/def ::transformation.combine/columnNames
  (s/tuple ::dataset.column.s/columnName ::dataset.column.s/columnName))
(s/def ::transformation.combine/newColumnTitle string?)
(s/def ::transformation.combine/separator string?)
(s/def ::transformation.combine/args
  (s/keys :req-un [::transformation.combine/columnNames
		   ::transformation.combine/newColumnTitle
		   ::transformation.combine/separator]))
(defmethod op-spec "core/combine"  [_]
  (s/keys
   :req-un [::transformation.combine/args
	    ::transformation.engine/onError]))

(s/def ::transformation.delete-column/args
  (s/keys :req-un [::dataset.column.s/columnName]))
(defmethod op-spec "core/delete-column"  [_]
  (s/keys
   :req-un [::transformation.delete-column/args
	    ::transformation.engine/onError]))

(s/def ::transformation.derive/code (s/with-gen
				      (s/and string? t.derive.js-engine/evaluable?)
				      #(s/gen #{"x=1"})))

(s/def ::transformation.derive/newColumnTitle string?)
(s/def ::transformation.derive/newColumnType ::dataset.column.s/type)
(s/def ::transformation.derive/args
  (s/keys :req-un [::transformation.derive/code
		   ::transformation.derive/newColumnTitle
		   ::transformation.derive/newColumnType]))
(defmethod op-spec "core/derive"  [_]
  (s/keys
   :req-un [::transformation.derive/args
	    ::transformation.engine/onError]))

(s/def ::transformation.filter-column/is string?)
(s/def ::transformation.filter-column/contains string?)
(s/def ::transformation.filter-column/expression (s/keys :opt-un [::transformation.filter-column/is
								  ::transformation.filter-column/contains]))
(s/def ::transformation.filter-column/args
  (s/keys :req-un [::transformation.filter-column/expression
                   ::dataset.column.s/columnName]))
(defmethod op-spec "core/filter-column"  [_]
  (s/keys
   :req-un [::transformation.filter-column/args
	    ::transformation.engine/onError]))

(s/def ::transformation.geo/columnNameLat ::dataset.column.s/columnName)
(s/def ::transformation.geo/columnNameLong ::dataset.column.s/columnName)
(s/def ::transformation.geo/columnTitleGeo string?)
(s/def ::transformation.geo/ColumnTitleGeo string?)

(s/def ::transformation.geo/args
  (s/keys :req-un [::transformation.geo/columnNameLat
		   ::transformation.geo/columnNameLong]
	  :opt-un [::transformation.geo/columnTitleGeo
		   ::transformation.geo/ColumnTitleGeo]))

(defmethod op-spec "core/generate-geopoints"  [_]
  (s/keys
   :req-un [::transformation.geo/args
	    ::transformation.engine/onError]))

(s/def ::transformation.merge-datasets/source
  (s/keys :req-un [::t.merge-dataset.source.s/mergeColumn 
		   ::t.merge-dataset.source.s/mergeColumns
		   ::t.merge-dataset.source.s/datasetId 
		   ::t.merge-dataset.source.s/aggregationColumn]))

(s/def ::transformation.merge-datasets/target
  (s/keys :req-un [::t.merge-dataset.source.s/mergeColumn]))

(s/def ::transformation.merge-datasets/args (s/keys :req-un [::transformation.merge-datasets/source
							     ::transformation.merge-datasets/target]))

(defmethod op-spec "core/merge-datasets"  [_]
  (s/keys
   :req-un [::transformation.merge-datasets/args]))

(s/def ::transformation.sort-column/sortDirection #{"ASC" "DESC"})
(s/def ::transformation.sort-column/args
  (s/keys :req-un [::dataset.column.s/columnName
		   ::transformation.sort-column/sortDirection]))
(defmethod op-spec "core/sort-column"  [_]
  (s/keys
   :req-un [::transformation.sort-column/args
	    ::transformation.engine/onError]))
(defmethod op-spec "core/remove-sort"  [_]
  (s/keys
   :req-un [::transformations.remove-sort.s/args
	    ::transformation.engine/onError]))

(s/def ::transformation.rename-column/newColumnTitle string?)
(s/def ::transformation.rename-column/args
  (s/keys :req-un [::dataset.column.s/columnName
		   ::transformation.rename-column/newColumnTitle]))
(defmethod op-spec "core/rename-column" [_]
  (s/keys
   :req-un [::transformation.rename-column/args
	    ::transformation.engine/onError]))

(s/def ::transformation.reverse-geocode/title string?)
(s/def ::transformation.reverse-geocode/geopointColumn ::dataset.column.s/columnName)
(s/def ::transformation.reverse-geocode/target
  (s/keys :req-un [::transformation.reverse-geocode/title
		   ::transformation.reverse-geocode/geopointColumn]))
(s/def ::transformation.reverse-geocode/datasetId string?)
(s/def ::transformation.reverse-geocode/geoshapeColumn ::dataset.column.s/columnName)
(s/def ::transformation.reverse-geocode/mergeColumn ::dataset.column.s/columnName)
(s/def ::transformation.reverse-geocode/source
  (s/keys :req-un [::transformation.reverse-geocode/datasetId
		   ::transformation.reverse-geocode/geoshapeColumn
		   ::transformation.reverse-geocode/mergeColumn]))
(s/def ::transformation.reverse-geocode/args
  (s/keys :req-un [::transformation.reverse-geocode/target
		   ::transformation.reverse-geocode/source]))
(defmethod op-spec "core/reverse-geocode" [_]
  (s/keys
   :req-un [::transformation.reverse-geocode/args]))

;; following op-spec specs defined appart in their namespace, thus 
(defmethod op-spec "core/to-lowercase" [_]
  (s/keys
   :req-un [::transformations.text.s/args
	    ::transformation.engine/onError]))
(defmethod op-spec "core/to-uppercase" [_]
  (s/keys
   :req-un [::transformations.text.s/args
	    ::transformation.engine/onError]))
(defmethod op-spec "core/to-titlecase" [_]
  (s/keys
   :req-un [::transformations.text.s/args
	    ::transformation.engine/onError]))
(defmethod op-spec "core/trim" [_]
  (s/keys
   :req-un [::transformations.text.s/args
	    ::transformation.engine/onError]))
(defmethod op-spec "core/trim-doublespace" [_]
  (s/keys
   :req-un [::transformations.text.s/args
	    ::transformation.engine/onError]))

(s/def ::transformation.engine/op-spec
  (s/multi-spec op-spec ::transformation.engine/op))

(s/def ::transformation/transformation
  (s/with-gen
    (s/and ::transformation.engine/op-spec transformation.engine/valid?) 
    #(s/gen #{{:op "core/trim"
	       :args {"columnName" "a"}
	       :onError "leave-empty"}})))

(s/def ::transformation/type #{:transformation :undo})

(s/def ::transformation.engine/success? boolean?)
(s/def ::transformation.engine/message string?)
(s/def ::transformation.engine/execution-log (s/tuple string?))

(defmulti command-spec ::transformation/type)

(defmethod command-spec :undo [_]
  (s/keys :req [::transformation/type]))

(defmethod command-spec :transformation [_]
  (s/keys :req-un [::transformation/transformation]))

(s/def ::transformation/command (s/multi-spec command-spec ::transformation/type))

(s/fdef transformation.engine/error-strategy
  :ret ::transformation.engine/onError)
(s/fdef transformation.engine/try-apply-operation
  :args (s/cat :tenant-conn ::db.s/spec
               :table-name string?
               :columns ::dataset.s/columns
               :op-spec ::transformation.engine/op-spec)
  :ret (s/keys :req-un [::transformation.engine/success? ::transformation.engine/message ]
               :opt-un [::dataset.s/columns ::transformation.engine/execution-log ]))
(s/fdef transformation.engine/execute-transformation
  :args (s/cat :tenant-conn ::db.s/spec
               :dataset-id string?
               :job-execution-id string?
               :transformation ::transformation/transformation)
  :ret ::lib/response)
(s/fdef transformation.engine/execute-undo
  :args (s/cat :tenant-conn ::db.s/spec
               :dataset-id string?
               :job-execution-id string?)
  :ret ::lib/response)
(s/fdef transformation.engine/next-column-name
  :args (s/cat :columns ::dataset.s/columns)
  :ret string?)
(s/fdef transformation/apply
  :args (s/cat :tenant-conn ::db.s/spec
               :dataset-id ::lumen.s/str-uuid
               :command ::transformation/command))
