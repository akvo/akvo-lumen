(ns akvo.lumen.transformation.merge-columns
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defmethod engine/valid? :core/merge-datasets
  [op-spec]
  (let [source (get-in op-spec ["args" "source"])
        target (get-in op-spec ["args" "target"])]
    (and (engine/valid-column-name? (get source "keyColumn"))
         (every? engine/valid-column-name? (get source "mergeColumns"))
         (string? (get source "datasetId"))
         (engine/valid-column-name? (get target "keyColumn")))))

(defn merge-column-names-map
  "Returns a map translating merge column names to new column names that can be used in the target dataset"
  [columns merge-columns]
  (loop [m {} columns columns merge-columns merge-columns]
    (if (empty? merge-columns)
      m
      (let [new-column-name (engine/next-column-name columns)
            merge-column (first merge-columns)
            new-merge-column (assoc merge-column "columnName" new-column-name)]
        (recur (assoc m (get merge-column "columnName") new-column-name)
               (conj columns new-merge-column)
               (rest merge-columns))))))


;; :identifiers
(defn fetch-data
  "Returns a map from key-column-value -> ..."
  [conn table-name column-names-mapping key-column-name merge-column-names]
  (let [data (rest
              (jdbc/query conn
                          [(format "SELECT %s, %s FROM %s"
                                   key-column-name
                                   (s/join ", " merge-column-names)
                                   table-name)]
                          {:as-arrays? true}))]
    (reduce (fn [result data-row]
              (assoc result
                     (first data-row)
                     (zipmap (map column-names-mapping merge-column-names)
                             (rest data-row))))
            {}
            data)))

(defn add-columns [conn table-name columns]
  (doseq [column columns]
    (add-column conn {:table-name table-name
                      :new-column-name (get column "columnName")
                      :column-type (condp = (get column "type")
                                     "text" "text"
                                     "number" "double precision"
                                     "date" "timestamptz"
                                     ;; TODO GEO
                                     )})))

(defn insert-merged-data [conn table-name target-key-column-name data]
  (doseq [[key-value data-map] data]
    (jdbc/update! conn
                  table-name
                  data-map
                  [(str target-key-column-name "= ?") key-value])))

(defn apply-merge-operation
  [conn table-name columns op-spec]
  (let [source (get-in op-spec ["args" "source"])
        source-dataset-id (get source "datasetId")
        source-dataset (if-let [source-dataset (latest-dataset-version-by-dataset-id conn {:dataset-id source-dataset-id})]
                         source-dataset
                         (throw (ex-info (format "Dataset %s does not exist" source-dataset-id)
                                         {:spec op-spec})))
        source-table-name (:table-name source-dataset)
        source-key-column-name (get source "keyColumn")
        source-merge-column-names (get source "mergeColumns")
        source-merge-columns (filterv (fn [column]
                                        (contains? (set source-merge-column-names)
                                                   (get column "columnName")))
                                      (:columns source-dataset))
        column-names-mapping (merge-column-names-map columns source-merge-columns)
        target-merge-columns (mapv #(-> %
                                        (update "columnName" column-names-mapping)
                                        (assoc "sort" nil
                                               "direction" nil
                                               "key" false
                                               "hidden" false))
                                   source-merge-columns)
        target-key-column-name (get-in op-spec ["args" "source" "keyColumn"])
        data (fetch-data conn source-table-name column-names-mapping source-key-column-name source-merge-column-names)]
    (add-columns conn table-name target-merge-columns)
    (insert-merged-data conn table-name target-key-column-name data)
    {:success? true
     :execution-log ["merged"]
     :columns (into columns target-merge-columns)}))

(defmethod engine/apply-operation :core/merge-datasets
  [conn table-name columns op-spec]
  (apply-merge-operation conn table-name columns op-spec))
