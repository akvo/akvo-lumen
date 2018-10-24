(ns akvo.lumen.transformation.delete-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [clojure.string :as str]
            [akvo.lumen.transformation.merge-datasets :as merge-datasets]
            [clojure.walk :refer (keywordize-keys)]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defmethod engine/valid? :core/delete-column
  [op-spec]
  (engine/valid-column-name? (col-name op-spec)))

(defmethod engine/apply-operation :core/delete-column
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [res         (mapv (juxt merge-datasets/distinct-columns :origin)
                          (merge-datasets/sources-related tenant-conn (:dataset-id op-spec)))
        kw-columns   (keywordize-keys columns)
        columnName  (-> (keywordize-keys op-spec) :args :columnName)
        full-column (first (filter #(= columnName (:columnName %)) kw-columns))
        resres      (map second (filter (fn [[cns datasource]]
                                          (log/error :cns cns columnName)
                                          (not-empty (filter #(= % columnName) cns)))
                                        res))]
    (log/error :CK (empty? resres) (str/join "," (map :title resres)))
    (if (empty? resres)
      (let [column-name (col-name op-spec)
            column-idx  (engine/column-index columns column-name)]
        (delete-column tenant-conn {:table-name table-name :column-name column-name})
        {:success?      true
         :execution-log [(format "Deleted column %s" column-name)]
         :columns       (into (vec (take column-idx columns))
                              (drop (inc column-idx) columns))})
      {:success? false
       :message  (format "following datasets have merge operations based on this column %s " (str/join "," (map (juxt :title :id) resres)))})))
