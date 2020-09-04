(ns akvo.lumen.lib.transformation.text
  "Simple text transforms"
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation.text :as db.tx.text]
            [akvo.lumen.util :as util]
            [clojure.tools.logging :as log]))

(defn- transform
  [tenant-conn dataset-versions op-spec fn]
  (let [{column-name "columnName"} (engine/args op-spec)
        namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)
        table-name (:table-name dsv)
        columns (vec (:columns dsv))]
    (db.tx.text/text-transform tenant-conn {:table-name table-name
                                            :column-name column-name
                                            :fn fn})
    {:success? true
     :execution-log [(format "Text transform %s on %s" fn column-name)]
     :dataset-versions (vals (-> dataset-versions
                                 (assoc-in [namespace :columns] columns)
                                 (update-in ["main" :transformations]
                                            engine/update-dsv-txs op-spec columns columns)))}))

(defn valid? [op-spec]
  (util/valid-column-name? (get (engine/args op-spec) "columnName")))

(defmethod engine/valid? "core/trim" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/trim"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (transform tenant-conn dataset-versions op-spec "trim"))

(defmethod engine/columns-used "core/trim"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])

(defmethod engine/avoidable-if-missing? "core/trim"
  [applied-transformation]
  true)

(defmethod engine/valid? "core/to-lowercase" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/to-lowercase"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (transform tenant-conn dataset-versions op-spec "lower"))

(defmethod engine/columns-used "core/to-lowercase"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])

(defmethod engine/avoidable-if-missing? "core/to-lowercase"
  [applied-transformation]
  true)

(defmethod engine/valid? "core/to-uppercase" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/to-uppercase"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (transform tenant-conn dataset-versions op-spec "upper"))

(defmethod engine/columns-used "core/to-uppercase"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])

(defmethod engine/avoidable-if-missing? "core/to-uppercase"
  [applied-transformation]
  true)

(defmethod engine/valid? "core/to-titlecase" [op-spec]
  (valid? op-spec))

(defmethod engine/columns-used "core/to-titlecase"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])

(defmethod engine/avoidable-if-missing? "core/to-titlecase"
  [applied-transformation]
  true)

(defmethod engine/apply-operation "core/to-titlecase"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (transform tenant-conn dataset-versions op-spec "initcap"))

(defmethod engine/valid? "core/trim-doublespace" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/trim-doublespace"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)
        dsv (get dataset-versions namespace)
        table-name (:table-name dsv)
        columns (:columns dsv)]
    (db.tx.text/trim-doublespace tenant-conn {:table-name table-name
                                              :column-name column-name})
    {:success? true
     :execution-log [(format "Text transform trim-doublespace on %s" column-name)]
     :dataset-versions (vals (-> dataset-versions
                                 (assoc-in [namespace :columns] columns)
                                 (update-in ["main" :transformations]
                                            engine/update-dsv-txs op-spec (:columns dsv) columns)))}))

(defmethod engine/columns-used "core/trim-doublespace"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])


(defmethod engine/avoidable-if-missing? "core/trim-doublespace"
  [applied-transformation]
  true)
