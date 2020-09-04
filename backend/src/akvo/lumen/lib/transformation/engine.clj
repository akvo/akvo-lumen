(ns akvo.lumen.lib.transformation.engine
  (:require [akvo.lumen.util :as util]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]))

(defmulti columns-used
  (fn [applied-transformation columns]
    (:op applied-transformation)))

(defmethod columns-used :default
  [applied-transformation columns]
  (throw (ex-info (str "unimplemented defmulti columns-used for tx: " (:op applied-transformation))
                  {:transformation applied-transformation})))

(defmethod columns-used nil
  [applied-transformation columns]
  [])

(defmulti avoidable-if-missing?
  (fn [transformation]
    (:op transformation)))

(defmethod avoidable-if-missing? :default
  [transformation]
  false)

(defn log-ex [e]
  (log/info e))

(defmulti valid?
  "Validate transformation spec"
  (fn [op-spec]
    (op-spec "op")))

(defmethod valid? :default
  [op-spec]
  false)

(defmulti apply-operation
  "Applies a particular operation based on `op` key from spec
   * {:keys [tenant-conn] :as deps}: includes open connection to the database
   * dataset-versions: each one contains the table-name and column to operate (ds_<uuid>)
   * op-spec: JSON payload with the operation settings
   spec is a JSON payload with the following keys:
   - \"op\" : operation to perform
   - \"args\" : map with arguments to the operation
   - \"onError\" : Error strategy"
  (fn [deps dataset-versions  op-spec]
    (get op-spec "op")))

(defmethod apply-operation :default
  [deps dataset-versions op-spec]
  (let [msg (str "Unknown operation " (get op-spec "op"))]
    (log/debug msg)
    {:success? false
     :message msg}))

(defn- try-apply-operation
  "invoke apply-operation inside a try-catch"
  [deps dataset-versions columns op-spec]
  (try
    (apply-operation deps dataset-versions op-spec)
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

(defn is-derived? [column-name]
  (boolean (re-matches #"d\d+$" column-name)))

(defn next-column-index [columns]
  (let [nums (->> columns
                  (map #(get % "columnName"))
                  (filter is-derived?)
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
  (let [dataset-versions (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
        namespaces (set (map :namespace dataset-versions))
        previous-columns (vec (flatten (map :columns dataset-versions)))]
    (let [{:keys [namespace success? message columns execution-log error-data]}
          (try-apply-operation deps dataset-versions (assoc transformation :dataset-id dataset-id))
          namespace (or namespace (get transformation "namespace" "main"))]
      (when-not success?
        (log/errorf "Failed to transform: %s, columns: %s, execution-log: %s, data: %s" message columns execution-log error-data)
        (throw (ex-info (or message "") {})))
      (doseq [dataset-version dataset-versions]
             (let [new-dataset-version-id (str (util/squuid))]
               (db.transformation/clear-dataset-version-data-table tenant-conn {:id (:id dataset-version)})
               (let [next-dataset-version {:id new-dataset-version-id
                                           :dataset-id dataset-id
                                           :job-execution-id job-execution-id
                                           :table-name (:table-name dataset-version)
                                           :imported-table-name (:imported-table-name dataset-version)
                                           :version (inc (:version dataset-version))
                                           :namespace (:namespace dataset-version)
                                           :transformations (if (= (:namespace dataset-version) "main")
                                                              (w/keywordize-keys
                                                               (conj (vec (:transformations dataset-version))
                                                                     (assoc transformation
                                                                            "changedColumns" (diff-columns previous-columns
                                                                                                           columns))))
                                                              (vec (:transformations dataset-version)))
                                           :columns (if (= (:namespace dataset-version) namespace)
                                                      (vec (filter
                                                            #(if (= "main" (:namespace dataset-version))
                                                               ((complement contains?) (disj namespaces "main") (:groupId %))
                                                               (= namespace (:groupId %)))
                                                            (w/keywordize-keys columns)))
                                                      (vec (:columns dataset-version)))}]
                 (db.dataset-version/new-dataset-version tenant-conn next-dataset-version))))
      (db.transformation/touch-dataset tenant-conn {:id dataset-id}))))

(defn- apply-undo [{:keys [tenant-conn] :as deps} dataset-id job-execution-id current-dataset-version]
  (let [imported-table-name (:imported-table-name current-dataset-version)
        previous-table-name (:table-name current-dataset-version)
        initial-columns (vec (:columns (db.transformation/initial-dataset-version-to-update-by-dataset-id
                                        tenant-conn
                                        {:dataset-id dataset-id})))
        table-name (util/gen-table-name "ds")]
    (db.transformation/copy-table tenant-conn
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
          (db.transformation/clear-dataset-version-data-table tenant-conn {:id (:id current-dataset-version)})
          (let [next-dataset-version {:id new-dataset-version-id
                                      :dataset-id dataset-id
                                      :job-execution-id job-execution-id
                                      :table-name table-name
                                      :imported-table-name (:imported-table-name current-dataset-version)
                                      :version (inc (:version current-dataset-version))
                                      :transformations (w/keywordize-keys
                                                        (vec
                                                         (butlast
                                                          (:transformations current-dataset-version))))
                                      :columns (w/keywordize-keys columns)}]
            (db.dataset-version/new-dataset-version tenant-conn
                                 next-dataset-version)
            (db.transformation/touch-dataset tenant-conn {:id dataset-id})
            (db.transformation/drop-table tenant-conn {:table-name previous-table-name})))
        (let [transformation (assoc (first transformations) :dataset-id dataset-id)
              {:keys [success? message columns execution-log] :as transformation-result}
              (try-apply-operation deps [{:table-name table-name :namespace "main"}] (assoc transformation :dataset-id dataset-id))]
          (if success?
            (recur (rest transformations) columns (into full-execution-log execution-log) (inc tx-index))
            (do
              (log/info (str "Unsuccessful undo of dataset: " dataset-id))
              (log/debug message)
              (log/debug "Job executionid: " job-execution-id)
              (throw (ex-info (str "Failed to undo transformation index:" tx-index ". Tx message:" message) {:transformation-result transformation-result
                                                                                     :transformation transformation})))))))))

(defn execute-undo [{:keys [tenant-conn] :as deps} dataset-id job-execution-id]
  (let [current-dataset-version (first (filter #(= "main" (:namespace %)) (db.transformation/latest-dataset-version-by-dataset-id tenant-conn
                                                                                                                            {:dataset-id dataset-id})))]
    (when (not= (:version current-dataset-version) 1)
      (apply-undo deps
                  dataset-id
                  job-execution-id
                  current-dataset-version))))

(defmulti adapt-transformation
  (fn [op-spec older-columns new-columns]
    (get op-spec "op")))

(defmethod adapt-transformation :default
  [op-spec older-columns new-columns]
  op-spec)

(defn apply-dataset-transformations-on-table
  "no transactional thus we can discard the temporary table we are working with"
  [conn caddisfly dataset-id transformations table-name new-columns old-columns]
  (loop [transformations transformations
         columns         new-columns
         applied-txs     []]
    (if-let [transformation (first transformations)]
      (let [transformation       (adapt-transformation transformation old-columns columns)
            avoid-tranformation? (let [t (w/keywordize-keys transformation)]
                                   (and
                                    (avoidable-if-missing? t)
                                    ((complement set/subset?)
                                     (set (columns-used t columns))
                                     (set (map #(get % "columnName") columns)))))]
        (if avoid-tranformation?
          (recur (rest transformations) columns  applied-txs)
          (let [op (try-apply-operation {:tenant-conn conn :caddisfly caddisfly} table-name columns (assoc transformation :dataset-id dataset-id))]
            (when-not (:success? op)
              (throw
               (ex-info (format "Failed to update due to transformation mismatch: %s . TX: %s" (:message op) transformation) {})))
            (let [applied-txs (conj applied-txs
                                    (assoc transformation "changedColumns"
                                           (diff-columns columns (:columns op))))]
              (db.job-execution/vacuum-table conn {:table-name table-name})
              (recur (rest transformations) (:columns op)  applied-txs)))))
      {:columns             (w/keywordize-keys columns)
       :transformations     (w/keywordize-keys (vec applied-txs))})))

(defn column-title-error? [column-title columns]
  (when (not-empty (filter #(= column-title (get % "title")) columns))
    {:success? false
     :message  (format "In this dataset there's already a column with this name: %s. Please choose another non existing name" column-title)}))

(defn get-namespace [op-spec]
  (get op-spec "namespace" "main"))

(defn get-dsv [dataset-versions namespace]
  (first (filter #(= (:namespace %) namespace) dataset-versions)))

(defn get-table-name-by-ns [dataset-versions namespace]
  (:table-name (get-dsv dataset-versions namespace)))

(defn get-table-name [dataset-versions op-spec]
  (get-table-name-by-ns dataset-versions (get-namespace op-spec)))


