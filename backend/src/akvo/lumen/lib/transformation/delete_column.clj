(ns akvo.lumen.lib.transformation.delete-column
  (:require [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [akvo.lumen.lib.aggregation.commons :as aggregation.commons]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.transformation.merge-datasets :as merge-datasets]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.specs.visualisation :as s.visualisation]
            [akvo.lumen.util :as util]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [clojure.walk :as walk]))

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defmethod engine/valid? "core/delete-column"
  [op-spec]
  (util/valid-column-name? (col-name op-spec)))

(defn- merged-sources-with-column
  "search for merged-datasets with this column related"
  [tenant-conn column-name dataset-id]
  (->> (merge-datasets/sources-related tenant-conn dataset-id)
       (mapv (juxt merge-datasets/distinct-columns :origin))
       (filter (fn [[distinct-columns _]]
                 (not-empty (filter #(= % column-name) distinct-columns))))))

(defn visualisations-with-dataset-column [tenant-conn dataset-id column-name]
 (->> (visualisation/visualisations-by-dataset-id tenant-conn dataset-id)
      (map #(let [{:keys [spec visualisationType id name] :as viz} (walk/keywordize-keys %)
                  columns (aggregation.commons/spec-columns ::s.visualisation/visualisation viz )]
              [id name columns]))
      (filter (fn [[id name columns]]
                (some #(= % column-name) columns)))))

(defmethod engine/apply-operation "core/delete-column"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (let [column-name (col-name op-spec)
        all-columns (engine/all-columns dataset-versions)
        namespace (engine/get-namespace all-columns column-name)
        dsv (get dataset-versions namespace)
        table-name (:table-name dsv)
        columns (:columns dsv)
        merged-sources (merged-sources-with-column tenant-conn column-name (:dataset-id op-spec))]
    (if (empty? merged-sources)
      (if-let [existent-viss (seq (visualisations-with-dataset-column tenant-conn (:dataset-id op-spec) column-name))]        
        {:success? false
         :message  (format "Cannot delete column. It is used in the following visalisations: %s"
                           (str/join ", " (map #(format "'%s'" (second %))  existent-viss)))
         :error-data existent-viss}
        (let [column-idx  (engine/column-index columns column-name)
              new-columns (into (vec (take column-idx columns))
                                (drop (inc column-idx) columns))]
          (db.tx.engine/delete-column tenant-conn {:table-name table-name :column-name column-name})
          {:success?      true
           :execution-log [(format "Deleted column %s" column-name)]
           :dataset-versions (vals (-> dataset-versions
                                           (assoc-in [namespace :columns] new-columns)
                                           (update-in [namespace :transformations]
                                                      engine/update-dsv-txs op-spec (:columns dsv) new-columns)))}))
      {:success? false
       :message  (format "Cannot delete column. It is used in merge transformations of dataset: %s"
                         (str/join "," (map (comp :title second) merged-sources)))})))

(defmethod engine/columns-used "core/delete-column"
  [applied-transformation columns]
  [(:columnName (:args applied-transformation))])

(defmethod engine/avoidable-if-missing? "core/delete-column"
  [applied-transformation]
  true)
