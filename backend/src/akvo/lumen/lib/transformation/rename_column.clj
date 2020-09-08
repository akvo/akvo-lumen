(ns akvo.lumen.lib.transformation.rename-column
  (:require [akvo.lumen.util :as util]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.lib.transformation.engine :as engine]))

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defn new-col-title [op-spec]
  (get (engine/args op-spec) "newColumnTitle"))

(defmethod engine/valid? "core/rename-column"
  [op-spec]
  (and (util/valid-column-name? (col-name op-spec))
       (string? (new-col-title op-spec))))

(defmethod engine/apply-operation "core/rename-column"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)]
    (if-let [response-error (engine/column-title-error? (new-col-title op-spec) (:columns dsv))]
            response-error
            (let [column-name      (col-name op-spec)
                  new-column-title (new-col-title op-spec)
                  new-columns (engine/update-column (:columns dsv) column-name assoc "title" new-column-title)]
              {:success?      true
               :execution-log [(format "Renamed column %s to %s" column-name new-column-title)]
               :dataset-versions (vals (-> dataset-versions
                                           (assoc-in [namespace :columns] new-columns)
                                           (update-in ["main" :transformations]
                                                      engine/update-dsv-txs op-spec (:columns dsv) new-columns)))}))))

(defmethod engine/columns-used "core/rename-column"
  [applied-transformation columns]
  [(-> applied-transformation :args :columnName)])

(defmethod engine/namespaces "core/rename-column"
  [op-spec columns]
  [(-> (find-column columns (get-in op-spec ["args" "columnName"]))
       :groupId
       engine/coerce-namespace)])


