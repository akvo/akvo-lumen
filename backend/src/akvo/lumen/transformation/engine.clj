(ns akvo.lumen.transformation.engine
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(defmulti valid?
  "Validate transformation spec"
  (fn [op-spec]
    (keyword (op-spec ::op))))

(defmethod valid? :default
  [op-spec]
  false)

(defmulti apply-operation
  "Applies a particular operation based on `op` key from spec
   * tenant-conn: Open connection to the database
   * table-name: table on which to operate (ds_<uuid>)
   * columns: in-memory representation of a columns spec
   * op-spec: JSON payload with the operation settings
   spec is a JSON payload with the following keys:
   - \"op\" : operation to perform
   - \"args\" : map with arguments to the operation
   - \"onError\" : Error strategy"
  (fn [tenant-conn table-name columns op-spec]
    (keyword (get op-spec ::op))))

(defmethod apply-operation :default
  [tenant-conn table-name columns op-spec]
  (let [msg (str "Unknown operation " (get op-spec :op))]
    (log/debug msg)
    {:success? false
     :message msg}))

(defn try-apply-operation
  "invoke apply-operation inside a try-catch"
  [tenant-conn table-name columns op-spec]
  (try
    (apply-operation tenant-conn table-name columns op-spec)
    (catch Exception e
      (log/debug e)
      {:success? false
       :message (format "Failed to transform: %s" (.getMessage e))})))

(defn pg-escape-string [s]
  (when-not (nil? s)
    (when-not (string? s)
      (throw (ex-info "Not a string" {:s s})))
    (str/replace s "'" "''")))

(defn ensure-number [n]
  (when-not (or (nil? n)
                (number? n))
    (throw (ex-info "Not a number" {:n n})))
  n)

(defn valid-column-name? [s]
  (and (string? s)
       (boolean (re-find #"^[a-z][a-z0-9_]*$" s))))

(defn valid-dataset-id? [s]
  (and (string? s)
       (boolean (re-find #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" s))))

(def valid-column-types #{"text" "number" "date" "geopoint"})

(defn valid-type? [s]
  (valid-column-types s))

(defn column-index
  "Returns the column index for a given column-name"
  [columns column-name]
  (let [idx (first
             (keep-indexed #(when (= column-name (get %2 :columnName)) %1) columns))]
    (if (nil? idx)
      (throw (ex-info "Column not found" {:column-name column-name
                                          :columns columns}))
      idx)))

(defn column-type
  "Lookup the type of a column"
  [columns column-name]
  (let [idx (column-index columns column-name)]
    (get-in columns [idx :type])))

(defn update-column [columns column-name f & args]
  (let [idx (column-index columns column-name)]
    (apply update columns idx f args)))

(defn error-strategy [op-spec]
  (get op-spec :onError))

(defn args [op-spec]
  (get op-spec :args))

(defn next-column-name [columns]
  (let [nums (->> columns
                  (map #(get % :columnName))
                  (filter #(re-find #"^d\d+$" %))
                  (map #(subs % 1))
                  (map #(Long/parseLong %)))]
    (str "d"
         (if (empty? nums)
           1
           (inc (apply max nums))))))

(defn- deliver-promise-success [promise dataset-id dataset-version-id job-execution-id]
  (deliver promise {:status "OK"
                    :jobExecutionId job-execution-id
                    :datasetVersionId dataset-version-id
                    :datasetId dataset-id}))

(defn- deliver-promise-failure [promise dataset-id job-id message]
  (deliver promise {:status "FAILED"
                    :datasetId dataset-id
                    :jobExecutionId job-id
                    :message message}))

(defn index-by [key coll]
  (reduce (fn [index item]
            (assoc index (get item key) item))
          {}
          coll))

(defn diff-columns [previous-columns next-columns]
  (let [previous-columns (index-by "columnName" previous-columns)
        next-columns (index-by "columnName" next-columns)
        all-column-names (set/union (set (keys previous-columns))
                                    (set (keys next-columns)))
        changed-columns (for [column-name all-column-names
                              :let [before (get previous-columns column-name)
                                    after (get next-columns column-name)]
                              :when (not= before after)]
                          {"before" before "after" after})]
    (reduce (fn [diff {:strs [before after]}]
              (let [column-name (or (get before "columnName")
                                    (get after "columnName"))]
                (assoc diff column-name {"before" before "after" after})))
            {}
            changed-columns)))

(defn execute-transformation
  [tenant-conn dataset-id job-execution-id transformation]
  (let [dataset-version (latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
        previous-columns (vec (:columns dataset-version))
        source-table (:table-name dataset-version)]
    (let [{:keys [success? message columns execution-log]}
          (try-apply-operation tenant-conn source-table (w/keywordize-keys previous-columns) transformation)]
      (when-not success?
        (log/errorf "Failed to transform: %s, columns: %s, execution-log: %s" message columns execution-log)
        (throw (ex-info "Failed to transform" {})))
      (let [new-dataset-version-id (str (util/squuid))]
        (clear-dataset-version-data-table tenant-conn {:id (:id dataset-version)})
        (let [next-dataset-version {:id new-dataset-version-id
                                    :dataset-id dataset-id
                                    :job-execution-id job-execution-id
                                    :table-name source-table
                                    :imported-table-name (:imported-table-name dataset-version)
                                    :version (inc (:version dataset-version))
                                    :transformations (conj (vec (:transformations dataset-version))
                                                           (assoc transformation
                                                                  "changedColumns" (diff-columns previous-columns
                                                                                                 (w/stringify-keys columns))))
                                    :columns columns}]
          (new-dataset-version tenant-conn next-dataset-version)
          (touch-dataset tenant-conn {:id dataset-id})
          (lib/created next-dataset-version))))))

(defn- apply-undo [tenant-conn dataset-id job-execution-id current-dataset-version]
  (let [imported-table-name (:imported-table-name current-dataset-version)
        previous-table-name (:table-name current-dataset-version)
        initial-columns (vec (:columns (dataset-version-by-dataset-id tenant-conn
                                                                      {:dataset-id dataset-id
                                                                       :version 1})))
        table-name (util/gen-table-name "ds")]
    (copy-table tenant-conn
                {:source-table imported-table-name
                 :dest-table table-name}
                {}
                {:transaction? false})
    (loop [transformations (butlast (:transformations current-dataset-version))
           columns initial-columns
           full-execution-log []]
      (if (empty? transformations)
        (let [new-dataset-version-id (str (util/squuid))]
          (clear-dataset-version-data-table tenant-conn {:id (:id current-dataset-version)})
          (let [next-dataset-version {:id new-dataset-version-id
                                      :dataset-id dataset-id
                                      :job-execution-id job-execution-id
                                      :table-name table-name
                                      :imported-table-name (:imported-table-name current-dataset-version)
                                      :version (inc (:version current-dataset-version))
                                      :transformations (vec
                                                        (butlast
                                                         (:transformations current-dataset-version)))
                                      :columns columns}]
            (new-dataset-version tenant-conn
                                 next-dataset-version)
            (touch-dataset tenant-conn {:id dataset-id})                                 
            (drop-table tenant-conn {:table-name previous-table-name})
            (lib/created next-dataset-version)))
        (let [{:keys [success? message columns execution-log]}
              (try-apply-operation tenant-conn table-name (w/keywordize-keys columns) (w/keywordize-keys (first transformations)))]
          (if success?
            (recur (rest transformations) columns (into full-execution-log execution-log))
            (do
              (log/info (str "Unsuccessful undo of dataset: " dataset-id))
              (log/debug message)
              (log/debug "Job executionid: " job-execution-id)
              (throw (ex-info "Failed to undo" {})))))))))

(defn execute-undo [tenant-conn dataset-id job-execution-id]
  (let [current-dataset-version (latest-dataset-version-by-dataset-id tenant-conn
                                                                      {:dataset-id dataset-id})
        current-version (:version current-dataset-version)]
    (if (= current-version 1)
      (lib/created (assoc current-dataset-version :dataset-id dataset-id))
      (apply-undo tenant-conn
                  dataset-id
                  job-execution-id
                  current-dataset-version))))
