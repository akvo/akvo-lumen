(ns akvo.lumen.lib.transformation.merge-datasets
  (:require [akvo.lumen.util :as util]
            [akvo.lumen.lib.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.set :as set]
            [clojure.set :refer (rename-keys) :as set]
            [clojure.string :as s]
            [clojure.walk :refer (keywordize-keys)]
            [hugsql.core :as hugsql])
  (:import [java.sql Timestamp]
           [org.postgis PGgeometry]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation/engine.sql")

(defmethod engine/valid? "core/merge-datasets"
  [op-spec]
  (let [source (get-in op-spec ["args" "source"])
        target (get-in op-spec ["args" "target"])]
    (and (util/valid-column-name? (get source "mergeColumn"))
         (every? util/valid-column-name? (get source "mergeColumns"))
         (util/valid-dataset-id? (get source "datasetId"))
         (let [aggregation-column (get source "aggregationColumn")]
           (or (nil? aggregation-column)
               (util/valid-column-name? aggregation-column)))
         (#{"ASC" "DESC"} (get source "aggregationDirection"))
         (util/valid-column-name? (get target "mergeColumn")))))

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
  [table-name {:strs [mergeColumn mergeColumns aggregationColumn aggregationDirection]}]
  (format "SELECT DISTINCT ON (%1$s) %1$s, %2$s FROM %3$s ORDER BY %1$s, %4$s %5$s NULLS LAST"
          mergeColumn
          (s/join ", " mergeColumns)
          table-name
          (or aggregationColumn mergeColumn)
          aggregationDirection))

(defn ->pggeometry [value]
  (doto
    (PGgeometry/geomFromString value)
    (.setSrid 4326)))

(defn ->timestamp [value]
  (Timestamp. value))

(defn to-sql-types
  [row merge-columns]
  (let [requires-cast? #(contains? #{"date" "geopoint" "geoshape"} (get % "type"))
        columns-requiring-cast (filter requires-cast? merge-columns)]
    (reduce (fn [result-row {:strs [columnName type]}]
              (update result-row columnName
                      (fn [v]
                        (when v (case type
                                  "date" (->timestamp v)
                                  "geopoint" (->pggeometry v)
                                  "geoshape" (->pggeometry v))))))
            row
            columns-requiring-cast)))

(defn fetch-data
  "Fetch data from the source dataset and returns a map with the shape
  {<merge-column-value> {<new-column-name> <value>}}"
  [conn table-name merge-columns column-names-translation source]
  (let [merge-column-name (get source "mergeColumn")
        rows (jdbc/query conn
                         (fetch-sql table-name source)
                         {:keywordize? false})]
    (reduce (fn [result row]
              (let [merge-column-value (get row merge-column-name)
                    data-to-merge (-> row
                                      (dissoc merge-column-name)
                                      (set/rename-keys column-names-translation)
                                      (to-sql-types merge-columns))]
                (assoc result merge-column-value data-to-merge)))
            {}
            rows)))

(defn add-columns
  "Add the new columns to the target dataset"
  [conn table-name columns]
  (doseq [column columns]
    (add-column conn {:table-name table-name
                      :new-column-name (get column "columnName")
                      :column-type (condp = (get column "type")
                                     "date" "timestamptz"
                                     "geopoint" "geometry(POINT, 4326)"
                                     "geoshape" "geometry(GEOMETRY, 4326)"
                                     "number" "double precision"
                                     "multiple" "text"
                                     "text" "text")})))

(defn insert-merged-data
  "Insert the merged values into the target dataset"
  [conn table-name target data]
  (let [target-merge-column (get target "mergeColumn")]
    (doseq [[merge-value data-map] data]
      (jdbc/update! conn
                    table-name
                    data-map
                    [(str target-merge-column "= ?") merge-value]))))

(defn get-source-dataset [conn source]
  (let [source-dataset-id (get source "datasetId")]
    (if-let [source-dataset (latest-dataset-version-by-dataset-id conn {:dataset-id source-dataset-id})]
      source-dataset
      (throw (ex-info (format "Dataset %s does not exist" source-dataset-id)
                      {:source source})))))

(defn get-source-merge-columns [source source-dataset]
  (let [column-names (set (get source "mergeColumns"))]
    (filterv (fn [column]
               (contains? column-names
                          (get column "columnName")))
             (:columns source-dataset))))

(defn get-target-merge-columns [source-merge-columns column-names-translation]
  (mapv #(-> %
             (update "columnName" column-names-translation)
             (assoc "sort" nil
                    "direction" nil
                    "key" false
                    "hidden" false))
        source-merge-columns))

(defn apply-merge-operation
  [conn table-name columns op-spec]
  (let [source (get-in op-spec ["args" "source"])
        target (get-in op-spec ["args" "target"])
        source-dataset (get-source-dataset conn source)
        source-table-name (:table-name source-dataset)
        source-merge-columns (get-source-merge-columns source
                                                       source-dataset)
        column-names-translation (merge-column-names-map columns
                                                         source-merge-columns)
        target-merge-columns (get-target-merge-columns source-merge-columns
                                                       column-names-translation)
        data (fetch-data conn
                         source-table-name
                         target-merge-columns
                         column-names-translation
                         source)]
    (add-columns conn table-name target-merge-columns)
    (insert-merged-data conn table-name target data)
    {:success? true
     :execution-log [(format "Merged columns from %s into %s"
                             source-table-name
                             table-name)]
     :columns (into columns target-merge-columns)}))

(defmethod engine/apply-operation "core/merge-datasets"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (apply-merge-operation tenant-conn table-name columns op-spec))

(defn- merged-datasets-diff [tenant-conn merged-dataset-sources]
  (let [dataset-ids (mapv :datasetId merged-dataset-sources)
        diff        (set/difference (set dataset-ids)
                                    (set (map :id (select-datasets-by-id tenant-conn {:ids dataset-ids}))))]
    (when (not-empty diff)
      {:diff diff})))

(defn distinct-columns
  "returns a distinct collection with the columns that participate in a merge operation"
  [merge-op]
  (distinct
   (filter some?
           (-> (:mergeColumns merge-op)
               (conj (:mergeColumn merge-op))
               (conj (:aggregationColumn merge-op))))))

(defn- merged-columns-diff [dss merge-source-op]
  (let [merged-dataset (some #(when (= (:dataset-id %) (:datasetId merge-source-op)) %) dss)
        columns        (distinct-columns merge-source-op)
        expected-columns (set (map #(get % "columnName") (:columns merged-dataset)))
        diff (set/difference (set columns) expected-columns)]
    (when (not-empty diff)
      {:diff diff
       :dataset-id (:datasetId merge-source-op)})))

(defn consistency-error? [tenant-conn dataset-id]
  (let [merged-sources (->> (latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
                            :transformations
                            keywordize-keys
                            (filter #(= "core/merge-datasets" (:op %)))
                            (map #(-> % :args :source)))]
    (if-let [ds-diff (and (not-empty merged-sources)
                          (merged-datasets-diff tenant-conn merged-sources))]
      {:error        (format "This version of the dataset isn't consistent thus it has merge transformations with datasets which were already removed. Dataset diff: %s" (reduce str ds-diff))
       :dataset-diff ds-diff}
      (when-let [column-diff (when (not-empty merged-sources)
                               (let [dss              (->> {:dataset-ids (mapv :datasetId merged-sources)}
                                                           (latest-dataset-versions-by-dataset-ids tenant-conn)
                                                           (map #(rename-keys % {:dataset_id :dataset-id})))
                                     column-diff-coll (->> merged-sources
                                                           (map (partial merged-columns-diff dss))
                                                           (filter some?))]
                                 (when (not-empty column-diff-coll)
                                   column-diff-coll)))]
        {:error(format "This version of the dataset isn't consistent thus it has merge transformations with datasets columns which were already removed from their datasets: %s" (reduce str column-diff))
         :column-diff column-diff}))))

(defn sources-related
  "return the list of transformations sources that use target-dataset-id,
  add `:origin` to each item in collection to keep a reference to the dataset-version
  that contains the transformation
  Example schema returned:
  {:datasetId 'uuid-str,
   :mergeColumn 'str
   :mergeColumns ['str]
   :aggregationColumn 'str
   :aggregationDirection 'str
   :origin {:id 'uuid-str
            :title 'str}}"
  [tenant-conn target-dataset-id]
  (->> (latest-dataset-versions tenant-conn) ;; all dataset_versions
       (filter #(not= target-dataset-id (:dataset_id %))) ;; exclude (target-)dataset(-id)
       (map (fn [dataset-version]
              ;; get source datasets of merge transformations with appended dataset-version as origin
              (->> (keywordize-keys (:transformations dataset-version))
                   (filter #(= "core/merge-datasets" (:op %)))
                   (map #(-> % :args :source))
                   (map #(assoc % :origin {:id    (:dataset_id dataset-version)
                                           :title (:title dataset-version)})))))
       (reduce into []) ;; adapt from (({:a :b})({:c :d})) to [{:a :b}{:c :d}]
       (filter #(= (:datasetId %) target-dataset-id))))

(defn datasets-related
  "return the list of dataset-versions that use target-dataset-id in their merge transformations
  Example schema returned
  [{:id 'uuid-str
    :title 'str}]"
  [tenant-conn target-dataset-id]
  (let [origins (map :origin (sources-related tenant-conn target-dataset-id))]
    (when-not (empty? origins) origins)))
