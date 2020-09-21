(ns akvo.lumen.specs.caddisfly
  (:require [akvo.lumen.lib.multiple-column :as lib.multiple-column]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.util :as u]
            [akvo.lumen.lib.transformation.multiple-column.caddisfly :as multiple-column.caddisfly]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(create-ns  'akvo.lumen.specs.caddisfly.result)
(alias 'caddisfly.result 'akvo.lumen.specs.caddisfly.result)

(s/def ::caddisfly.result/id pos-int?)
(s/def ::caddisfly.result/name string?)
(s/def ::caddisfly.result/unit string?)

(s/def ::result (s/keys :req-un [::caddisfly.result/id ::caddisfly.result/name]
                        :opt-un [::caddisfly.result/unit]))

(s/def ::results (s/coll-of ::result :kind vector? :distinct true))

(s/def ::name string?)
(s/def ::uuid ::lumen.s/str-uuid)
(s/def ::hasImage boolean?)
(s/def ::schema (s/keys :req-un [::name ::uuid ::results ::hasImage]))


(s/fdef multiple-column.caddisfly/columns-to-extract
  :args (s/cat
         :columns any?
         :selected-column any?
         :caddisfly-schema ::schema
         :extractImage boolean?)
  :ret any?)


(s/def ::columns (s/coll-of any?))
(s/def ::adapted-schema (s/keys :req-un [::hasImage ::columns]))

(s/fdef  lib.multiple-column/adapt-schema
  :args (s/cat :schema ::schema)
  :ret ::adapted-schema)
