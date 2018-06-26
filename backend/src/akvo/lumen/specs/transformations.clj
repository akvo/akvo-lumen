(ns akvo.lumen.specs.transformations
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset :as l.dataset]
            [akvo.lumen.specs.core :as lumen.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.libs]
            [akvo.lumen.transformation :as transformation]
            [akvo.lumen.transformation.engine :as engine]
            [clojure.spec.alpha :as s]))

(s/def ::transformation/transformation
  (s/with-gen
    engine/valid?
    #(s/gen #{{"op" "core/trim"
               "args" {"columnName" "a"}
               "onError" "leave-empty"}})))

(s/def ::transformation/type #{:transformation :undo})

(s/def ::transformation/command (s/keys :req-un [::transformation/type]
                                        :opt-un [::transformation/transformation]))

(s/def ::transformation/apply-args
  (s/cat :tenant-conn ::db.s/spec
         :dataset-id string?
         :command ::transformation/command))

(s/fdef transformation/apply
  :args ::transformation/apply-args)

(s/def ::engine/js-value-types #{"number" "text" "date"})


(s/def ::engine/error-strategy #{"leave-empty" "fail" "delete-row"})

(s/def ::engine/op #{"core/change-datatype"
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
                     "core/trim-doublespace" "a"})

(s/def ::engine/args
  (s/with-gen  map?
    #(s/gen #{{"arg1" "val1" "arg2" "val2" "arg3" "val3"}})))

(s/fdef engine/error-strategy :ret ::engine/error-strategy)

(s/def ::engine/op-spec (s/with-gen  map?
                          #(s/gen #{"op" (lumen.s/sample ::engine/op)
                                    "args" (lumen.s/sample ::engine/args)
                                    "onError" (lumen.s/sample ::engine/error-strategy)})))


(s/def ::engine/try-apply-operation-args (s/cat :tenant-conn ::db.s/spec
                                                :table-name string?
                                                :columns (s/coll-of ::dataset.s/column :gen-max 3)
                                                :op-spec ::engine/op-spec))

(s/def ::engine/success? boolean?)
(s/def ::engine/message string?)
(s/def ::engine/columns (s/coll-of ::l.dataset/column :gen-max 3))
(s/def ::engine/execution-log (s/tuple string?))
(s/def ::engine/try-apply-operation-ret (s/keys :req-un [::engine/success? ::engine/message ]
                                                :opt-un [::engine/columns ::engine/execution-log ]))


(s/fdef engine/try-apply-operation
  :args ::engine/try-apply-operation-args
  :ret ::engine/try-apply-operation-ret)

(s/def ::engine/execute-transformation-args (s/cat :tenant-conn ::db.s/spec
                                                   :dataset-id string?
                                                   :job-execution-id string?
                                                   :transformation ::transformation/transformation))

(s/def ::engine/execute-undo-args (s/cat :tenant-conn ::db.s/spec
                                         :dataset-id string?
                                         :job-execution-id string?))

(s/fdef engine/execute-transformation
  :args ::engine/execute-transformation-args
  :ret ::lib/response)

(s/fdef engine/execute-undo
  :args ::engine/execute-undo-args
  :ret ::lib/response)

(s/def ::engine/next-column-name-args
  (s/coll-of ::dataset.s/column :gen-max 3))

(s/fdef engine/next-column-name
  :args (s/cat :columns ::engine/next-column-name-args)
  :ret string?)
