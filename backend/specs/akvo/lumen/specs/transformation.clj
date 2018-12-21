(ns akvo.lumen.specs.transformation
  (:require [akvo.lumen.specs :as lumen.s :refer (sample)]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as u]
            [akvo.lumen.specs.import.column :as import.column.s]
            [akvo.lumen.specs.import.values :as i.values.s]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(create-ns  'akvo.lumen.specs.db.dataset-version)
(alias 'db.dsv 'akvo.lumen.specs.db.dataset-version)

(create-ns  'akvo.lumen.specs.db.dataset-version.column)
(alias 'db.dsv.column 'akvo.lumen.specs.db.dataset-version.column)


(s/def ::db.dsv/id ::lumen.s/str-uuid)
(s/def ::db.dsv/dataset-id ::lumen.s/str-uuid)
(s/def ::db.dsv/job-execution-id (s/nilable ::lumen.s/str-uuid))

(defn- ds-table-name? [s]
  (let [[_ uuid] (string/split  s #"ds_")]
       (lumen.s/str-uuid? (string/replace uuid "_" "-"))))

(s/def ::db.dsv/table-name (s/with-gen
                             (s/and string? ds-table-name?)
                             #(s/gen (into #{} (take 5 (repeatedly (partial u/gen-table-name "ds")))))))

(defn- imported-table-name? [s]
  (let [[_ uuid] (string/split  s #"imported_")]
       (lumen.s/str-uuid? (string/replace uuid "_" "-"))))

(s/def ::db.dsv/imported-table-name (s/with-gen
                                      (s/and string? imported-table-name?)
                                      #(s/gen (into #{} (take 5 (repeatedly (fn [] (str "imported_" (u/squuid)))))))))

(s/def ::db.dsv/version int?)


(s/def ::db.dsv.column/key boolean?)
(s/def ::db.dsv.column/hidden boolean?)
(s/def ::sort #{"asc" "dsc"})

(s/def ::db.dsv.column/sort (s/nilable ::sort))
(s/def ::db.dsv.column/direction (s/nilable string?))
(s/def ::db.dsv.column/columnName string?)

(s/def ::db.dsv.column/id (s/nilable keyword?))
(s/def ::db.dsv/column* (s/keys :req-un [::db.dsv.column/hidden ::db.dsv.column/direction
                                         ::db.dsv.column/sort ::db.dsv.column/columnName]))

(s/def ::db.dsv/column (s/merge ::import.column.s/header ::db.dsv/column*))

(s/def ::db.dsv/columns (s/coll-of ::db.dsv/column :kind vector? :distinct true))

(s/def ::type #{:transformation :undo})

(defmulti command-spec :type)

(defmethod command-spec :undo [_]
  (s/keys :req-un [::type]))

(defmethod command-spec :transformation [_]
  (s/keys :req-un [::type]))

(s/def ::command (s/multi-spec command-spec :type))

(lumen.s/sample ::command)

(create-ns  'akvo.lumen.specs.transformation.engine)
(alias 'transformation.engine 'akvo.lumen.specs.transformation.engine)

(s/def ::transformation.engine/onError #{"leave-empty" "fail" "delete-row" "default-value"})

(s/def ::transformation.engine/op #{:core/change-datatype
				    :core/combine
				    :core/delete-column
				    :core/derive
				    :core/filter-column
				    :core/generate-geopoints
				    :core/merge-datasets
				    :core/remove-sort
				    :core/rename-column
				    :core/reverse-geocode
				    :core/sort-column
				    :core/to-lowercase
				    :core/to-titlecase
				    :core/to-uppercase
				    :core/trim
				    :core/trim-doublespace})

(defmulti op-spec :op)

(s/def ::transformation.engine/op-spec
  (s/multi-spec op-spec :op))

(create-ns  'akvo.lumen.specs.transformation.delete-column)
(alias 'transformation.delete-column 'akvo.lumen.specs.transformation.delete-column)

(s/def ::transformation.delete-column/args
  (s/keys :req-un [::db.dsv.column/columnName]))

(defmethod op-spec :core/delete-column  [_]
  (s/keys
   :req-un [::transformation.delete-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.change-datatype)
(alias 'transformation.change-datatype 'akvo.lumen.specs.transformation.change-datatype)

(s/def ::transformation.change-datatype/newType #{"number" "text" "date"})
(s/def ::transformation.change-datatype/defaultValue (s/nilable string?))

(s/def ::transformation.change-datatype/args
  (s/keys :req-un [::db.dsv.column/columnName
                   ::transformation.change-datatype/newType]))

(defmethod op-spec :core/change-datatype  [_]
  (s/keys
   :req-un [::transformation.change-datatype/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))



(create-ns  'akvo.lumen.specs.transformation.combine)
(alias 'transformation.combine 'akvo.lumen.specs.transformation.combine)

(s/def ::transformation.combine/newColumnTitle string?)

(s/def ::transformation.combine/separator string?)

(s/def ::transformation.combine/columnNames (s/coll-of ::db.dsv.column/columnName :kind vector? :distinct true)) 
(s/def ::transformation.combine/args
  (s/keys :req-un [::transformation.combine/columnNames
                   ::transformation.combine/newColumnTitle
                   ::transformation.combine/separator]))

(defmethod op-spec :core/combine  [_]
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

(defmethod op-spec :core/derive  [_]
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
  (s/keys :req-un [::db.dsv.column/columnName
                   ::transformation.filter-column/expression]))

(defmethod op-spec :core/filter-column  [_]
  (s/keys
   :req-un [::transformation.filter-column/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))


(create-ns  'akvo.lumen.specs.transformation.generate-geopoints)
(alias 'transformation.generate-geopoints 'akvo.lumen.specs.transformation.generate-geopoints)

(s/def ::transformation.generate-geopoints/columnNameLat ::db.dsv.column/columnName)
(s/def ::transformation.generate-geopoints/columnNameLong ::db.dsv.column/columnName)
(s/def ::transformation.generate-geopoints/columnTitleGeo string?)


(s/def ::transformation.generate-geopoints/args
  (s/keys :req-un [::transformation.generate-geopoints/columnNameLat
                   ::transformation.generate-geopoints/columnNameLong
                   ::transformation.generate-geopoints/columnTitleGeo]))

(defmethod op-spec :core/generate-geopoints  [_]
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



(s/def ::transformation.merge-datasets.source/datasetId ::db.dsv/dataset-id)
(s/def ::transformation.merge-datasets.source/aggregationColumn (s/nilable ::db.dsv.column/columnName))
(s/def ::transformation.merge-datasets.source/aggregationDirection #{"ASC" "DESC"})
(s/def ::transformation.merge-datasets.source/mergeColumn ::db.dsv.column/columnName)
(s/def ::transformation.merge-datasets.source/mergeColumns (s/coll-of ::db.dsv.column/columnName :kind vector? :distinct true))

(s/def ::transformation.merge-datasets/source (s/keys
                                               :req-un [::transformation.merge-datasets.source/datasetId
                                                        ::transformation.merge-datasets.source/aggregationColumn
                                                        ::transformation.merge-datasets.source/aggregationDirection
                                                        ::transformation.merge-datasets.source/mergeColumn
                                                        ::transformation.merge-datasets.source/mergeColumns]))

(s/def ::transformation.merge-datasets.target/mergeColumn ::db.dsv.column/columnName)

(s/def ::transformation.merge-datasets/target (s/keys :req-un [::transformation.merge-datasets.target/mergeColumn]))

(s/def ::transformation.merge-datasets/args
  (s/keys :req-un [::transformation.merge-datasets/source
                   ::transformation.merge-datasets/target]))

(defmethod op-spec :core/merge-datasets  [_]
  (s/keys
   :req-un [::transformation.merge-datasets/args
	    ::transformation.engine/onError
            ::transformation.engine/op]))

(lumen.s/sample ::transformation.engine/op-spec 10)

(create-ns  'akvo.lumen.specs.dataset-version.transformation)
(alias 'db.dsv.transformation 'akvo.lumen.specs.dataset-version.transformation)

(s/def ::db.dsv.transformation/changedColumns map?)

(s/def ::db.dsv.transformation/changedColumns* (s/keys :req-un [::db.dsv.transformation/changedColumns]))

(s/def ::db.dsv/transformation (s/merge ::transformation.engine/op-spec ::db.dsv.transformation/changedColumns*))

(s/def ::db.dsv/transformations (s/coll-of ::transformation.engine/op-spec :kind vector? :distinct true))

(s/def ::next-dataset-version (s/keys :req-un [::db.dsv/id ::db.dsv/dataset-id
                                               ::db.dsv/job-execution-id ::db.dsv/table-name
                                               ::db.dsv/imported-table-name ::db.dsv/version
                                               ::db.dsv/transformations ::db.dsv/columns]))

(lumen.s/sample ::next-dataset-version)

#_{"op" "core/delete-column",
 "args" {"columnName" "c\n2"},
 "onError" "fail",
 "changedColumns"
 {"c2"
  {"after" nil,
   "before"
   {"key" false,
    "sort" nil,
    "direction" nil,
    "title" "Column2",
    "type" "number",
    "multipleType" nil,
    "hidden" false,
    "multipleId" nil,
    "columnName" "c2"}}}}

