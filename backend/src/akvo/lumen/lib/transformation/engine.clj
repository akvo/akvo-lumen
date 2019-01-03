(ns akvo.lumen.lib.transformation.engine
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset_version.sql")

(defn log-ex [e]
  (log/info e))

(defmulti valid?
  "Validate transformation spec"
  (fn [op-spec]
    (keyword (op-spec "op"))))

(defmethod valid? :default
  [op-spec]
  false)

(defmulti apply-operation
  "Applies a particular operation based on `op` key from spec
   * {:keys [tenant-conn] :as deps}: includes open connection to the database
   * table-name: table on which to operate (ds_<uuid>)
   * columns: in-memory representation of a columns spec
   * op-spec: JSON payload with the operation settings
   spec is a JSON payload with the following keys:
   - \"op\" : operation to perform
   - \"args\" : map with arguments to the operation
   - \"onError\" : Error strategy"
  (fn [deps table-name columns op-spec]
    (keyword (get op-spec "op"))))

(defmethod apply-operation :default
  [deps table-name columns op-spec]
  (let [msg (str "Unknown operation " (get op-spec "op"))]
    (log/debug msg)
    {:success? false
     :message msg}))

(defn- try-apply-operation
  "invoke apply-operation inside a try-catch"
  [deps table-name columns op-spec]
  (try
    (apply-operation deps table-name columns op-spec)
    (catch Exception e
      (log-ex e)
      {:success? false
       :message (format "Failed to transform: %s" (.getMessage e))})))

(defn ensure-number [n]
  (when-not (or (nil? n)
                (number? n))
    (throw (ex-info "Not a number" {:n n})))
  n)

(defn column-index
  "Returns the column index for a given column-name"
  [columns column-name]
  (let [idx (first
             (keep-indexed #(when (= column-name (get %2 "columnName")) %1) columns))]
    (if (nil? idx)
      (throw (ex-info "Column not found" {:column-name column-name
                                          :columns columns}))
      idx)))

(defn column-type
  "Lookup the type of a column"
  [columns column-name]
  (let [idx (column-index columns column-name)]
    (get-in columns [idx "type"])))

(defn update-column [columns column-name f & args]
  (let [idx (column-index columns column-name)]
    (apply update columns idx f args)))

(defn error-strategy [op-spec]
  (get op-spec "onError"))

(defn args [op-spec]
  (get op-spec "args"))

(defn derivation-column-name
  [i]
  {:pre [(int? i)]}
  (format "d%s" i))

(defn next-column-index [columns]
  (let [nums (->> columns
                  (map #(get % "columnName"))
                  (filter #(re-find #"^d\d+$" %))
                  (map #(subs % 1))
                  (map #(Long/parseLong %)))]
    (if (empty? nums)
      1
      (inc (apply max nums)))))

(defn next-column-name [columns]
  (derivation-column-name (next-column-index columns)))

(defn diff-columns [previous-columns next-columns]
  (let [previous-columns (util/index-by "columnName" previous-columns)
        next-columns (util/index-by "columnName" next-columns)
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
  [{:keys [tenant-conn] :as deps} dataset-id job-execution-id transformation]
  (let [dataset-version (latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
        previous-columns (vec (:columns dataset-version))
        source-table (:table-name dataset-version)]
    (let [{:keys [success? message columns execution-log]}
          (try-apply-operation deps source-table previous-columns (assoc transformation :dataset-id dataset-id))]
      (when-not success?
        (log/errorf "Failed to transform: %s, columns: %s, execution-log: %s" message columns execution-log)
        (throw (ex-info (format "Failed to transform. %s" (or message "")) {})))
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
                                                                                                 columns)))
                                    :columns columns}]
          (new-dataset-version tenant-conn next-dataset-version)
          (touch-dataset tenant-conn {:id dataset-id})
          (lib/created next-dataset-version))))))

(defn- apply-undo [{:keys [tenant-conn] :as deps} dataset-id job-execution-id current-dataset-version]
  (let [imported-table-name (:imported-table-name current-dataset-version)
        previous-table-name (:table-name current-dataset-version)
        initial-columns (vec (:columns (initial-dataset-version-to-update-by-dataset-id
                                        tenant-conn
                                        {:dataset-id dataset-id})))
        table-name (util/gen-table-name "ds")]
    (copy-table tenant-conn
                {:source-table imported-table-name
                 :dest-table table-name}
                {}
                {:transaction? false})
    (loop [transformations (butlast (:transformations current-dataset-version))
           columns initial-columns
           full-execution-log []
           tx-index 0]
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
        (let [transformation (first transformations)
              {:keys [success? message columns execution-log] :as transformation-result}
              (try-apply-operation deps table-name columns transformation)]
          (if success?
            (recur (rest transformations) columns (into full-execution-log execution-log) (inc tx-index))
            (do
              (log/info (str "Unsuccessful undo of dataset: " dataset-id))
              (log/debug message)
              (log/debug "Job executionid: " job-execution-id)
              (throw (ex-info (str "Failed to undo transformation index:" tx-index) {:transformation-result transformation-result
                                                                                     :transformation transformation})))))))))

(defn execute-undo [{:keys [tenant-conn] :as deps} dataset-id job-execution-id]
  (let [current-dataset-version (latest-dataset-version-by-dataset-id tenant-conn
                                                                      {:dataset-id dataset-id})
        current-version (:version current-dataset-version)]
    (if (= current-version 1)
      (lib/created (assoc current-dataset-version :dataset-id dataset-id))
      (apply-undo deps
                  dataset-id
                  job-execution-id
                  current-dataset-version))))

(defmulti adapt-transformation
  (fn [op-spec older-columns new-columns]
    (keyword (get op-spec "op"))))

(defmethod adapt-transformation :default
  [op-spec older-columns new-columns]
  op-spec)


(defn apply-transformation-log [conn table-name imported-table-name
                                new-columns old-columns dataset-id job-execution-id
                                {:keys [transformations version] :as dataset-version}]
  (update-dataset-version conn {:dataset-id      dataset-id
                                :version         version
                                :columns         new-columns
                                :transformations []})
  (loop [transformations transformations
         columns         new-columns
         version         (inc version)
         applied-txs     []]
    (if-let [transformation (first transformations)]
      (let [transformation (adapt-transformation transformation old-columns columns)
            op             (try-apply-operation {:tenant-conn conn} table-name columns transformation)]
        (when-not (:success? op)
          (throw
           (ex-info (format "Failed to update due to transformation mismatch: %s" (:message op)) {})))
        (let [applied-txs (conj applied-txs
                                (assoc transformation "changedColumns"
                                       (diff-columns columns (:columns op))))]
          (update-dataset-version conn {:dataset-id      dataset-id
                                        :version         version
                                        :columns         (:columns op)
                                        :transformations applied-txs})
          (recur (rest transformations) (:columns op) (inc version) applied-txs)))
      (new-dataset-version conn {:id                  (str (util/squuid))
                                    :dataset-id          dataset-id
                                    :job-execution-id    job-execution-id
                                    :table-name          table-name
                                    :imported-table-name imported-table-name
                                    :version             (inc (:version dataset-version))
                                    :columns             columns
                                    :transformations     (vec applied-txs)}))))
