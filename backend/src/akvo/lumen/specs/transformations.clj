(ns akvo.lumen.specs.transformations
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset :as lib.dataset]
            [akvo.lumen.specs.core :as lumen.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.libs]
            [akvo.lumen.transformation :as transformation]
            [akvo.lumen.transformation.derive :as transformation.derive]
            [akvo.lumen.transformation.engine :as transformation.engine]
            [clojure.spec.alpha :as s]))

(s/def ::transformation/transformation
  (s/with-gen
    transformation.engine/valid?
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

(s/def ::transformation.engine/js-value-types #{"number" "text" "date"})

(s/def ::transformation.engine/error-strategy #{"leave-empty" "fail" "delete-row"})

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
                                    "core/trim-doublespace" "a"})

(s/def ::transformation.engine/args
  (s/with-gen  map?
    #(s/gen #{{"arg1" "val1" "arg2" "val2" "arg3" "val3"}})))

(s/fdef transformation.engine/error-strategy
  :ret ::transformation.engine/error-strategy)

(s/def ::transformation.engine/op-spec
  (s/with-gen  map?
    #(s/gen #{"op" (lumen.s/sample ::transformation.engine/op)
              "args" (lumen.s/sample ::transformation.engine/args)
              "onError" (lumen.s/sample ::transformation.engine/error-strategy)})))


(s/def ::transformation.engine/try-apply-operation-args
  (s/cat :tenant-conn ::db.s/spec
         :table-name string?
         :columns (s/coll-of ::dataset.s/column :gen-max 3)
         :op-spec ::transformation.engine/op-spec))

(s/def ::transformation.engine/success? boolean?)
(s/def ::transformation.engine/message string?)
(s/def ::transformation.engine/columns (s/coll-of ::lib.dataset/column :gen-max 3))
(s/def ::transformation.engine/execution-log (s/tuple string?))
(s/def ::transformation.engine/try-apply-operation-ret
  (s/keys :req-un [::transformation.engine/success? ::transformation.engine/message ]
          :opt-un [::transformation.engine/columns ::transformation.engine/execution-log ]))


(s/fdef engine/try-apply-operation
  :args ::transformation.engine/try-apply-operation-args
  :ret ::transformation.engine/try-apply-operation-ret)

(s/def ::transformation.engine/execute-transformation-args
  (s/cat :tenant-conn ::db.s/spec
         :dataset-id string?
         :job-execution-id string?
         :transformation ::transformation/transformation))

(s/def ::transformation.engine/execute-undo-args
  (s/cat :tenant-conn ::db.s/spec
         :dataset-id string?
         :job-execution-id string?))

(s/fdef engine/execute-transformation
  :args ::transformation.engine/execute-transformation-args
  :ret ::lib/response)

(s/fdef engine/execute-undo
  :args ::transformation.engine/execute-undo-args
  :ret ::lib/response)

(s/def ::transformation.engine/next-column-name-args
  (s/coll-of ::dataset.s/column :gen-max 3))

(s/fdef engine/next-column-name
  :args (s/cat :columns ::transformation.engine/next-column-name-args)
  :ret string?)
