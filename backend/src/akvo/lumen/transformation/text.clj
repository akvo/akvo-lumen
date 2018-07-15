(ns akvo.lumen.transformation.text
  "Simple text transforms"
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/text.sql")

(defn- transform
  [tenant-conn table-name columns op-spec fn]
  (let [{:keys [columnName]} (engine/args op-spec)]
    (text-transform tenant-conn {:table-name table-name
                                 :column-name columnName
                                 :fn fn})
    {:success? true
     :execution-log [(format "Text transform %s on %s" fn columnName)]
     :columns columns}))

(defn valid? [op-spec]
  (engine/valid-column-name? (get (engine/args op-spec) :columnName)))

(defmethod engine/valid? :core/trim [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/trim
  [tenant-conn table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "trim"))

(defmethod engine/valid? :core/to-lowercase [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/to-lowercase
  [tenant-conn table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "lower"))

(defmethod engine/valid? :core/to-uppercase [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/to-uppercase
  [tenant-conn table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "upper"))

(defmethod engine/valid? :core/to-titlecase [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/to-titlecase
  [tenant-conn table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "initcap"))

(defmethod engine/valid? :core/trim-doublespace [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/trim-doublespace
  [tenant-conn table-name columns op-spec]
  (let [{:keys [columnName]} (engine/args op-spec)]
    (trim-doublespace tenant-conn {:table-name table-name
                                   :column-name columnName})
    {:success? true
     :execution-log [(format "Text transform trim-doublespace on %s" columnName)]
     :columns columns})
  {:success? true
   :columns columns})
