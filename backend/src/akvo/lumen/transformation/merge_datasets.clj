(ns akvo.lumen.transformation.merge-datasets
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
         (engine/valid-dataset-id? (get source "datasetId"))
         (let [order-by-column (get source "orderByColumn")]
           (or (nil? order-by-column)
               (engine/valid-column-name? order-by-column)))
         (#{"ASC" "DESC"} (get source "direction"))
         (engine/valid-column-name? (get target "keyColumn")))))

(defn merge-column-names-map
  "Returns a map translating source merge column names to new column names that can be used
  in the target dataset"
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

(defn fetch-sql
  [table-name {:strs [keyColumn mergeColumns orderByColumn direction]}]
  (format "SELECT DISTINCT ON (%1$s) %1$s, %2$s FROM %3$s ORDER BY %1$s, %4$s %5$s NULLS LAST"
          keyColumn
          (s/join ", " mergeColumns)
          table-name
          (or orderByColumn keyColumn)
          direction))

(defn fetch-data
  "Fetch data from the source dataset and returns a map with the shape
  {<key-column-value> {<new-column-nam> <value>}}"
  [conn table-name column-names-mapping source]
  (let [data (rest
              (jdbc/query conn
                          [(fetch-sql table-name source)]
                          {:as-arrays? true}))]
    (reduce (fn [result data-row]
              (assoc result
                     (first data-row)
                     (zipmap (map column-names-mapping (get source "mergeColumns"))
                             (rest data-row))))
            {}
            data)))

(defn add-columns
  "Add the new columns to the target dataset"
  [conn table-name columns]
  (doseq [column columns]
    (add-column conn {:table-name table-name
                      :new-column-name (get column "columnName")
                      :column-type (condp = (get column "type")
                                     "text" "text"
                                     "number" "double precision"
                                     "date" "timestamptz")})))

(defn insert-merged-data
  "Insert the merged values into the target dataset"
  [conn table-name target-key-column-name data]
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
        target-key-column-name (get-in op-spec ["args" "target" "keyColumn"])
        data (fetch-data conn source-table-name column-names-mapping source)]
    (add-columns conn table-name target-merge-columns)
    (insert-merged-data conn table-name target-key-column-name data)
    {:success? true
     :execution-log [(format "Merged columns %s from %s into %s"
                             source-merge-column-names
                             source-table-name
                             table-name)]
     :columns (into columns target-merge-columns)}))

(defmethod engine/apply-operation :core/merge-datasets
  [conn table-name columns op-spec]
  (apply-merge-operation conn table-name columns op-spec))
