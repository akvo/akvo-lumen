(ns akvo.lumen.transformation.delete-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [clojure.string :as str]
            [akvo.lumen.transformation.merge-datasets :as merge-datasets]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defmethod engine/valid? :core/delete-column
  [op-spec]
  (engine/valid-column-name? (col-name op-spec)))

(defn- merged-sources-with-column
  "search for merged-datasets with this column related"
  [tenant-conn column-name dataset-id]
  (->> (merge-datasets/sources-related tenant-conn dataset-id)
       (mapv (juxt merge-datasets/distinct-columns :origin))
       (filter (fn [[distinct-columns _]]
                 (not-empty (filter #(= % column-name) distinct-columns))))))

(defmethod engine/apply-operation :core/delete-column
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [column-name (col-name op-spec)
        merged-sources (merged-sources-with-column tenant-conn column-name (:dataset-id op-spec))]
    (if (empty? merged-sources)
      (let [column-idx  (engine/column-index columns column-name)]
        (delete-column tenant-conn {:table-name table-name :column-name column-name})
        {:success?      true
         :execution-log [(format "Deleted column %s" column-name)]
         :columns       (into (vec (take column-idx columns))
                              (drop (inc column-idx) columns))})
      {:success? false
       :message  (format "Following datasets have merge operations based on this column %s "
                         (str/join "," (map second merged-sources)))})))
