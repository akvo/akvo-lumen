(ns akvo.lumen.specs.transformation
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.transformation.engine :as lib.transformation.engine]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.db.dataset-version :as db.dsv.s]
            [akvo.lumen.specs.db.dataset-version.column :as db.dsv.column.s]
            [akvo.lumen.specs.import.column :as import.column.s]
            [akvo.lumen.specs.import.values :as i.values.s]
            [akvo.lumen.util :as u]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(def columnName? string?)

(s/def ::type #{:transformation :undo})

(defmulti command-spec :type)

(defmethod command-spec :undo [_]
  (s/keys :req-un [::type]))

(defmethod command-spec :transformation [_]
  (s/keys :req-un [::type]))

(s/def ::command (s/multi-spec command-spec :type))

(create-ns  'akvo.lumen.specs.transformation.engine)
(alias 'transformation.engine 'akvo.lumen.specs.transformation.engine)

(s/def ::transformation.engine/onError #{"leave-empty" "fail" "delete-row" "default-value"})

(s/def ::transformation.engine/op #{"core/change-datatype"
				    "core/combine"
				    "core/delete-column"
				    "core/derive"
                                    "core/extract-multiple"
				    "core/filter-column"
				    "core/generate-geopoints"
				    "core/merge-datasets"
				    "core/remove-sort"
				    "core/rename-column"
				    "core/reverse-geocode"
				    "core/sort-column"
                                    "core/split-column"
				    "core/to-lowercase"
				    "core/to-titlecase"
				    "core/to-uppercase"
				    "core/trim"
				    "core/trim-doublespace"})

(defmulti op-spec :op)

(s/def ::transformation.engine/op-spec
  (s/multi-spec op-spec :op))

(create-ns  'akvo.lumen.specs.transformation.delete-column)
(alias 'transformation.delete-column 'akvo.lumen.specs.transformation.delete-column)

(s/def ::transformation.delete-column/args
  (s/keys :req-un [::db.dsv.column.s/columnName]))

(defmethod op-spec "core/delete-column"  [_]
  (s/keys
   :req-un [::transformation.delete-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.change-datatype)
(alias 'transformation.change-datatype 'akvo.lumen.specs.transformation.change-datatype)

(s/def ::transformation.change-datatype/newType #{"number" "text" "date"})
(s/def ::transformation.change-datatype/defaultValue (s/or :n nil? :s string? :i int?))
(s/def ::transformation.change-datatype/parseFormat (s/nilable string?))

(s/def ::transformation.change-datatype/args
  (s/keys :req-un [::db.dsv.column.s/columnName
                   ::transformation.change-datatype/defaultValue
                   ::transformation.change-datatype/newType]
          :opt-un [::transformation.change-datatype/parseFormat]))

(defmethod op-spec "core/change-datatype"  [_]
  (s/keys
   :req-un [::transformation.change-datatype/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.combine)
(alias 'transformation.combine 'akvo.lumen.specs.transformation.combine)

(s/def ::transformation.combine/newColumnTitle string?)

(s/def ::transformation.combine/separator string?)

(s/def ::transformation.combine/columnNames (s/coll-of ::db.dsv.column.s/columnName :kind vector? :distinct true)) 
(s/def ::transformation.combine/args
  (s/keys :req-un [::transformation.combine/columnNames
                   ::transformation.combine/newColumnTitle
                   ::transformation.combine/separator]))

(defmethod op-spec "core/combine"  [_]
  (s/keys
   :req-un [::transformation.combine/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.derive)
(alias 'transformation.derive 'akvo.lumen.specs.transformation.derive)

(s/def ::transformation.derive/newColumnTitle string?) ;; reuse s/def also used in combine

(s/def ::transformation.derive/code string?) ;; improve js validation

(s/def ::transformation.derive/newColumnType #{"number" "text" "date"})

(s/def ::transformation.derive/args
  (s/keys :req-un [::transformation.derive/newColumnTitle
                   ::transformation.derive/code
                   ::transformation.derive/newColumnType]))

(defmethod op-spec "core/derive"  [_]
  (s/keys
   :req-un [::transformation.derive/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.filter-column)
(alias 'transformation.filter-column 'akvo.lumen.specs.transformation.filter-column)

(s/def ::transformation.filter-column/is string?)
(s/def ::transformation.filter-column/contains string?)
(s/def ::transformation.filter-column/expression (s/keys
                                                  :opt-un [::transformation.filter-column/is
                                                           ::transformation.filter-column/contains]))

(s/def ::transformation.filter-column/args
  (s/keys :req-un [::db.dsv.column.s/columnName
                   ::transformation.filter-column/expression]))

(defmethod op-spec "core/filter-column"  [_]
  (s/keys
   :req-un [::transformation.filter-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.generate-geopoints)
(alias 'transformation.generate-geopoints 'akvo.lumen.specs.transformation.generate-geopoints)

(s/def ::transformation.generate-geopoints/columnNameLat columnName?)
(s/def ::transformation.generate-geopoints/columnNameLong columnName?)
(s/def ::transformation.generate-geopoints/columnTitleGeo string?)


(s/def ::transformation.generate-geopoints/args
  (s/keys :req-un [::transformation.generate-geopoints/columnNameLat
                   ::transformation.generate-geopoints/columnNameLong
                   ::transformation.generate-geopoints/columnTitleGeo]))

(defmethod op-spec "core/generate-geopoints"  [_]
  (s/keys
   :req-un [::transformation.generate-geopoints/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.merge-datasets)
(alias 'transformation.merge-datasets 'akvo.lumen.specs.transformation.merge-datasets)

(create-ns  'akvo.lumen.specs.transformation.merge-datasets.source)
(alias 'transformation.merge-datasets.source 'akvo.lumen.specs.transformation.merge-datasets.source)

(create-ns  'akvo.lumen.specs.transformation.merge-datasets.target)
(alias 'transformation.merge-datasets.target 'akvo.lumen.specs.transformation.merge-datasets.target)



(s/def ::transformation.merge-datasets.source/datasetId (s/with-gen
                                                          lumen.s/str-uuid?
                                                          lumen.s/str-uuid-gen))
(s/def ::transformation.merge-datasets.source/aggregationColumn (s/nilable columnName?))

(s/def ::transformation.merge-datasets.source/aggregationDirection lumen.s/sort?)
(s/def ::transformation.merge-datasets.source/mergeColumn columnName?)
(s/def ::transformation.merge-datasets.source/mergeColumns (s/coll-of ::db.dsv.column.s/columnName :kind vector? :distinct true))

(s/def ::transformation.merge-datasets/source (s/keys
                                               :req-un [::transformation.merge-datasets.source/datasetId
                                                        ::transformation.merge-datasets.source/aggregationColumn
                                                        ::transformation.merge-datasets.source/aggregationDirection
                                                        ::transformation.merge-datasets.source/mergeColumn
                                                        ::transformation.merge-datasets.source/mergeColumns]))

(s/def ::transformation.merge-datasets.target/mergeColumn columnName?)


(s/def ::transformation.merge-datasets/target (s/keys :req-un [::transformation.merge-datasets.target/mergeColumn]))

(s/def ::transformation.merge-datasets/args
  (s/keys :req-un [::transformation.merge-datasets/source
                   ::transformation.merge-datasets/target]))

(defmethod op-spec "core/merge-datasets"  [_]
  (s/keys
   :req-un [::transformation.merge-datasets/args
            ::transformation.engine/op]))


(create-ns 'akvo.lumen.specs.transformation.extract-multiple)
(alias 'transformation.extract-multiple 'akvo.lumen.specs.transformation.extract-multiple)

(create-ns 'akvo.lumen.specs.transformation.extract-multiple.column)
(alias 'transformation.extract-multiple.column 'akvo.lumen.specs.transformation.extract-multiple.column)

(s/def ::transformation.extract-multiple/selectedColumn (s/merge ::db.dsv.s/column* :akvo.lumen.specs.import.column.multiple/header))
(s/def ::transformation.extract-multiple/extractImage boolean?)
(s/def ::transformation.extract-multiple.column/id int?)
(s/def ::transformation.extract-multiple.column/name string?)
(s/def ::transformation.extract-multiple.column/type #{"text"})
(s/def ::transformation.extract-multiple.column/extract boolean?)
(s/def ::transformation.extract-multiple.column/column
  (s/keys :req-un [::transformation.extract-multiple.column/id
                   ::transformation.extract-multiple.column/name
                   ::transformation.extract-multiple.column/type
                   ::transformation.extract-multiple.column/extract]))

(s/def ::transformation.extract-multiple/columns (s/coll-of ::transformation.extract-multiple.column/column
                                                            :kind vector? :distinct true))

(s/def ::transformation.extract-multiple/args
  (s/keys :req-un [::db.dsv.column.s/columnName
                   ::transformation.extract-multiple/selectedColumn
                   ::transformation.extract-multiple/extractImage]))

(defmethod op-spec "core/extract-multiple"  [_]
  (s/keys
   :req-un [::transformation.extract-multiple/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.rename-column)
(alias 'transformation.rename-column 'akvo.lumen.specs.transformation.rename-column)

(s/def ::transformation.rename-column/newColumnTitle string?) ;; reuse s/def also used in combine
(s/def ::transformation.rename-column/columnName columnName?)

(s/def ::transformation.rename-column/args
  (s/keys :req-un [::transformation.derive/newColumnTitle
                   ::transformation.rename-column/columnName]))

(defmethod op-spec "core/rename-column"  [_]
  (s/keys
   :req-un [::transformation.rename-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))




(create-ns  'akvo.lumen.specs.transformation.reverse-geocode)
(alias 'transformation.reverse-geocode 'akvo.lumen.specs.transformation.reverse-geocode)

(create-ns  'akvo.lumen.specs.transformation.reverse-geocode.source)
(alias 'transformation.reverse-geocode.source 'akvo.lumen.specs.transformation.reverse-geocode.source)

(create-ns  'akvo.lumen.specs.transformation.reverse-geocode.target)
(alias 'transformation.reverse-geocode.target 'akvo.lumen.specs.transformation.reverse-geocode.target)

(s/def ::transformation.reverse-geocode.source/datasetId ::db.dsv.s/dataset-id)
(s/def ::transformation.reverse-geocode.source/mergeColumn ::db.dsv.column.s/columnName)
(s/def ::transformation.reverse-geocode.source/geoshapeColumn ::db.dsv.column.s/columnName)

(s/def ::transformation.reverse-geocode/source
  (s/keys
   :req-un [::transformation.reverse-geocode.source/datasetId
            ::transformation.reverse-geocode.source/mergeColumn
            ::transformation.reverse-geocode.source/geoshapeColumn]))

(s/def ::transformation.reverse-geocode.target/geopointColumn ::db.dsv.column.s/columnName)
(s/def ::transformation.reverse-geocode.target/title string?)

(s/def ::transformation.reverse-geocode/target
  (s/keys :req-un [::transformation.reverse-geocode.target/geopointColumn
                   ::transformation.reverse-geocode.target/title]))

(s/def ::transformation.reverse-geocode/args
  (s/keys :req-un [::transformation.reverse-geocode/source
                   ::transformation.reverse-geocode/target]))

(defmethod op-spec "core/reverse-geocode"  [_]
  (s/keys
   :req-un [::transformation.reverse-geocode/args
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.sort-column)
(alias 'transformation.sort-column 'akvo.lumen.specs.transformation.sort-column)

(s/def ::transformation.sort-column/sortDirection lumen.s/sort?)
(s/def ::transformation.sort-column/columnName columnName?)

(s/def ::transformation.sort-column/args
  (s/keys :req-un [::transformation.sort-column/sortDirection
                   ::transformation.sort-column/columnName]))

(defmethod op-spec "core/sort-column"  [_]
  (s/keys
   :req-un [::transformation.sort-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.remove-sort)
(alias 'transformation.remove-sort 'akvo.lumen.specs.transformation.remove-sort)

(s/def ::transformation.remove-sort/columnName columnName?)

(s/def ::transformation.remove-sort/args
  (s/keys :req-un [::transformation.remove-sort/columnName]))

(defmethod op-spec "core/remove-sort"  [_]
  (s/keys
   :req-un [::transformation.remove-sort/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.split-column)
(alias 'transformation.split-column 'akvo.lumen.specs.transformation.split-column)

(s/def ::transformation.split-column/newColumnName string?)
(s/def ::transformation.split-column/pattern string?)
(s/def ::transformation.split-column/selectedColumn ::db.dsv.s/column)



 
(s/def ::transformation.split-column/args
  (s/keys :req-un [::transformation.split-column/newColumnName
                   ::transformation.split-column/selectedColumn
                   ::transformation.split-column/pattern]))

(defmethod op-spec "core/split-column"  [_]
  (s/keys
   :req-un [::transformation.split-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.trim)
(alias 'transformation.trim 'akvo.lumen.specs.transformation.trim)

(s/def ::transformation.trim/args
  (s/keys :req-un [::db.dsv.column.s/columnName]))

(defmethod op-spec "core/trim"  [_]
  (s/keys
   :req-un [::transformation.trim/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.to-lowercase)
(alias 'transformation.to-lowercase 'akvo.lumen.specs.transformation.to-lowercase)

(s/def ::transformation.to-lowercase/args
  (s/keys :req-un [::db.dsv.column.s/columnName]))

(defmethod op-spec "core/to-lowercase"  [_]
  (s/keys
   :req-un [::transformation.to-lowercase/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.to-uppercase)
(alias 'transformation.to-uppercase 'akvo.lumen.specs.transformation.to-uppercase)

(s/def ::transformation.to-uppercase/args
  (s/keys :req-un [::db.dsv.column.s/columnName]))

(defmethod op-spec "core/to-uppercase"  [_]
  (s/keys
   :req-un [::transformation.to-uppercase/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.to-titlecase)
(alias 'transformation.to-titlecase 'akvo.lumen.specs.transformation.to-titlecase)

(s/def ::transformation.to-titlecase/args
  (s/keys :req-un [::db.dsv.column.s/columnName]))

(defmethod op-spec "core/to-titlecase"  [_]
  (s/keys
   :req-un [::transformation.to-titlecase/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.transformation.trim-doublespace)
(alias 'transformation.trim-doublespace 'akvo.lumen.specs.transformation.trim-doublespace)

(s/def ::transformation.trim-doublespace/args
  (s/keys :req-un [::db.dsv.column.s/columnName]))

(defmethod op-spec "core/trim-doublespace"  [_]
  (s/keys
   :req-un [::transformation.trim-doublespace/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(create-ns  'akvo.lumen.specs.dataset-version.transformation)
(alias 'db.dsv.transformation 'akvo.lumen.specs.dataset-version.transformation)

(create-ns  'akvo.lumen.specs.dataset-version.transformation.changed-columns)
(alias 'db.dsv.transformation.changed-columns 'akvo.lumen.specs.dataset-version.transformation.changed-columns)

(s/def ::db.dsv.transformation.changed-columns/after (s/nilable ::db.dsv.s/column))

(s/def ::db.dsv.transformation.changed-columns/before (s/nilable ::db.dsv.s/column))

(s/def ::db.dsv.transformation.changed-columns/columnName keyword?)

(s/def ::db.dsv.transformation/changedColumns
  (s/map-of ::db.dsv.transformation.changed-columns/columnName (s/keys :req-un [::db.dsv.transformation.changed-columns/after
                                                                                ::db.dsv.transformation.changed-columns/before])))

(s/def ::db.dsv.transformation/changedColumns* (s/keys :req-un [::db.dsv.transformation/changedColumns]))

(s/def ::db.dsv.s/transformation (s/merge ::transformation.engine/op-spec ::db.dsv.transformation/changedColumns*))

(s/def ::db.dsv.s/transformations (s/coll-of ::db.dsv.s/transformation :kind vector? :distinct true))

(s/def ::next-dataset-version (s/keys :req-un [::db.dsv.s/id ::db.dsv.s/dataset-id
                                               ::db.dsv.s/job-execution-id ::db.dsv.s/table-name
                                               ::db.dsv.s/imported-table-name ::db.dsv.s/version
                                               ::db.dsv.s/transformations ::db.dsv.s/columns]))

(s/fdef lib.transformation.engine/new-dataset-version
  :args (s/cat :conn ::db.s/tenant-connection
               :dsv ::next-dataset-version))
