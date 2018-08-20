(ns akvo.lumen.transformation.multiple-column
  (:require 
            [akvo.lumen.dataset.utils :as u]
            [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.transformation.multiple-column.caddisfly :as caddisfly]
            [cheshire.core :as json]
            [clj-time.coerce :as tc]
            [clojure.walk :refer (keywordize-keys)]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn lumen->pg-type [type]
  (condp = type
    "text"   "text"
    "number" "double precision"
    "date"   "timestamptz"))

(defmethod engine/valid? :core/extract-multiple
  [op-spec]
  (let [{:keys [onError op args]}                      (keywordize-keys op-spec)
        {:keys [columns extractImage selectedColumn] } args
        columns-to-extract                             (filter :extract columns)
        res                                                    (and
                                                                (or extractImage (not-empty columns-to-extract))
                                                                (every? (comp  engine/valid-type? :type) columns-to-extract)
                                                                (#{"fail" "leave-empty" "delete-row"} onError))]
    
    (log/debug ::engine/valid? [ columns-to-extract extractImage selectedColumn onError op res])
    res))

(defmethod engine/apply-operation :core/extract-multiple
  [tenant-conn table-name columns op-spec]
  (let [{:keys [onError op args]}              (keywordize-keys op-spec)
        {:keys [extractImage selectedColumn] } args
        columns-to-extract                     (filter :extract (:columns args))
        base-opts {:table-name  table-name
                   :column-name "new-column-name"}]

    (log/debug :onError onError :op op :args args)
    (log/debug :columns-to-extract columns-to-extract)
    (log/debug :selectedColumn selectedColumn)
    (log/debug :find-column (u/find-column columns (:columnName selectedColumn)))
    (caddisfly/apply-operation tenant-conn table-name columns columns-to-extract args onError)))
