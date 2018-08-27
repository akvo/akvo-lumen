(ns akvo.lumen.transformation.multiple-column
  (:require [akvo.lumen.dataset.utils :as u]
            [akvo.lumen.transformation.engine :as t.engine]
            [akvo.lumen.transformation.multiple-column.caddisfly :as t.m-c.caddisfly]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys)]))

(defmethod t.engine/valid? :core/extract-multiple
  [op-spec]
  (let [{:keys [onError op args]} (keywordize-keys op-spec)
        columns-to-extract        (filter :extract (:columns args))]
    (and
     (or (:extractImage args) (not-empty columns-to-extract))
     (every? (comp t.engine/valid-type? :type) columns-to-extract)
     (#{"fail" "leave-empty" "delete-row"} onError))))

(defmethod t.engine/apply-operation :core/extract-multiple
  [deps table-name columns op-spec]
  (let [{:keys [onError op args] :as op-spec} (keywordize-keys op-spec)]
    ;; so far we only implement `caddisfly` in other case we throw exception based on core/condp impl
    (condp = (-> args :selectedColumn :multipleType)
      "caddisfly" (t.m-c.caddisfly/apply-operation deps table-name columns op-spec))))
