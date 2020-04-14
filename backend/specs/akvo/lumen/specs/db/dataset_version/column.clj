(ns akvo.lumen.specs.db.dataset-version.column
  (:require [clojure.spec.alpha :as s]))

(s/def ::key boolean?)

(s/def ::hidden boolean?)

(s/def ::sort #{"asc" "dsc"}) ;; TODO double check this values

(s/def ::sort (s/nilable pos-int?))

(s/def ::direction (s/nilable string?))

(def ^:dynamic *columnName?* string?)

(s/def ::columnName? #'*columnName?*)
(def column-name-gen #(s/gen (reduce (fn [c i] (conj c (str "c_" i))) #{} (range 100))))
(s/def ::columnName (s/with-gen
                      ::columnName?
                      column-name-gen)) ;; TODO improve with gen tuple

(s/def ::id (s/nilable keyword?))
