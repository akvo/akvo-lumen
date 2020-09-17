(ns akvo.lumen.lib.transformation.engine
  (:require [akvo.lumen.util :as util]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.lib.dataset.utils :as dataset.utils]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [clojure.walk :as w])
  (:import [java.time Instant]))

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

(defn unify-transformation-history [dataset-versions]
  (->> dataset-versions
       (map :transformations)
       (reduce into [])
       (sort-by #(get % "created") #(compare (Instant/parse %1) (Instant/parse %2)))))

(defn namespaces
  "return a vector of namespaces.
  So far transformations only could use one namespace, so this method will be used for validating purposes too"
  [column-names columns]
  (mapv
   #(let [c (dataset.utils/find-column columns %)]
      (:namespace % "main"))
   column-names))

(defn namespaces-by-op
  "return a vector of namespaces, being the first the target transformation namespace."
  [op-spec columns]
  (namespaces (columns-used op-spec columns) columns))

(defmulti apply-operation
  "Applies a particular operation based on `op` key from spec
   * {:keys [tenant-conn] :as deps}: includes open connection to the database
   * dataset-versions: {namespace dsv, namespace2 dsv2}
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
  [deps dataset-versions op-spec]
  (try
    (apply-operation deps (reduce #(assoc % (:namespace %2 "main") %2) {} dataset-versions) op-spec)
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
    (apply update (vec columns) idx f args)))

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

(defn update-dsv-txs [transformations new-transformation columns new-columns]
  (w/keywordize-keys
    (conj (vec transformations)
          (assoc new-transformation "changedColumns" (diff-columns columns new-columns)))))

(defn execute-transformation
  [{:keys [tenant-conn] :as deps} dataset-id job-execution-id transformation]
  (let [dataset-versions (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})]
    (let [{:keys [success? message dataset-versions execution-log error-data]}
          (try-apply-operation deps dataset-versions (assoc transformation
                                                            :dataset-id dataset-id))
          namespace (get transformation "namespace" "main")]
      (when-not success?
        (log/errorf "Failed to transform: %s, columns: %s, execution-log: %s, data: %s" message dataset-versions execution-log error-data)
        (throw (ex-info (or message "") {})))
      (doseq [dataset-version dataset-versions]
        (db.transformation/clear-dataset-version-data-table tenant-conn {:id (:id dataset-version)})
        (db.dataset-version/new-dataset-version tenant-conn (-> dataset-version
                                                                (assoc :id (str (util/squuid)))
                                                                (assoc :dataset-id dataset-id)
                                                                (assoc :job-execution-id job-execution-id)
                                                                (update :columns vec)
                                                                (update :transformations vec)
                                                                (update :version inc))))
      (db.transformation/touch-dataset tenant-conn {:id dataset-id}))))

(defn- apply-undo [{:keys [tenant-conn] :as deps} dataset-id job-execution-id current-dataset-versions]
  (let [table-names-dict (reduce (fn [c dsv]
                                   (assoc c (:namespace dsv)
                                          {:new (util/gen-table-name "ds")
                                           :imported (:imported-table-name dsv)
                                           :previous (:table-name dsv) })) {}
                                 current-dataset-versions)
        initial-dsvs (let [v (:version (db.transformation/initial-dataset-version-version-by-dataset-id tenant-conn {:dataset-id dataset-id}))]
                       (db.transformation/initial-dataset-version-to-update-by-dataset-id
                        tenant-conn
                        {:dataset-id dataset-id :version v}))
        current-version (:version (first current-dataset-versions))]
    (doseq [t (vals table-names-dict)] (db.transformation/copy-table tenant-conn
                                                                     {:source-table (:imported t)
                                                                      :dest-table (:new t)}
                                                                     {}
                                                                     {:transaction? false}))
    (loop [transformations (butlast (unify-transformation-history current-dataset-versions))
           dsvs initial-dsvs
           full-execution-log []
           tx-index 0]
      (if (empty? transformations)
        (do 
          (doseq [dataset-version dsvs]
            (db.transformation/clear-dataset-version-data-table tenant-conn {:id (:id dataset-version)})
            (let [tables (get table-names-dict (:namespace dataset-version))
                  new-dsv (-> dataset-version
                              (assoc :id (str (util/squuid)))
                              (assoc :dataset-id dataset-id)
                              (assoc :table-name (:new tables))
                              (assoc :imported-table-name (:imported tables))
                              (assoc :job-execution-id job-execution-id)
                              (assoc :version (inc current-version))
                              (update :columns vec)
                              (update :transformations vec))]
              (db.dataset-version/new-dataset-version tenant-conn new-dsv)
              (db.transformation/drop-table tenant-conn {:table-name (:previous tables)})))
          (db.transformation/touch-dataset tenant-conn {:id dataset-id}))
        (let [transformation (assoc (first transformations) :dataset-id dataset-id)
              dsvss (map #(assoc % :table-name (:new (get table-names-dict (:namespace %)))) dsvs)
              {:keys [success? message dataset-versions execution-log] :as transformation-result}
              (try-apply-operation deps dsvss transformation)]
          (if success?
            (recur (rest transformations) dataset-versions (into full-execution-log execution-log) (inc tx-index))
            (do
              (log/info (str "Unsuccessful undo of dataset: " dataset-id))
              (log/debug message)
              (log/debug "Job executionid: " job-execution-id)
              (throw (ex-info (str "Failed to undo transformation index:" tx-index ". Tx message:" message)
                              {:transformation-result transformation-result
                               :transformation transformation})))))))))

(defn execute-undo [{:keys [tenant-conn] :as deps} dataset-id job-execution-id]
  (let [current-dataset-versions (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})]
    (when (not= (:version (first current-dataset-versions)) 1)
      (apply-undo deps dataset-id job-execution-id current-dataset-versions))))

(defmulti adapt-transformation
  (fn [op-spec older-columns new-columns]
    (get op-spec "op")))

(defmethod adapt-transformation :default
  [op-spec older-columns new-columns]
  op-spec)

(defn- generate-dsvs [columns ns-table-names ns-imported-tables]
  (map (fn [[ns* cols]]
          {:imported-table-name (get ns-imported-tables ns*)
           :table-name (get ns-table-names ns*)
           :transformations []
           :namespace ns*
           :columns (vec cols)})
       (group-by #(get % "namespace") columns)))

(defn apply-dataset-transformations-on-table
  "no transactional thus we can discard the temporary table we are working with"
  [conn caddisfly dataset-id transformations ns-table-names ns-imported-tables new-columns old-columns]
  (let [new-columns (map #(update % "namespace" (fn [ns] (or ns "main"))) new-columns)]
    (loop [dsvs            (generate-dsvs new-columns ns-table-names ns-imported-tables)
           transformations transformations
           applied-txs     []]
      (if-let [transformation (first transformations)]
        (let [columns              (reduce into [] (map :columns dsvs))
              transformation       (adapt-transformation transformation old-columns columns)
              avoid-tranformation? (let [t (w/keywordize-keys transformation)]
                                     (and
                                      (avoidable-if-missing? t)
                                      ((complement set/subset?)
                                       (set (columns-used t columns))
                                       (set (map #(get % "columnName") columns)))))]
          (if avoid-tranformation?
            (recur dsvs (rest transformations) applied-txs)
            (let [{:keys [success? message dataset-versions execution-log error-data]} (try-apply-operation {:tenant-conn conn :caddisfly caddisfly} dsvs (assoc transformation :dataset-id dataset-id))]
              (when-not success?
                (throw
                 (ex-info (format "Failed to update due to transformation mismatch: %s . TX: %s" message transformation) {})))
              (let [tx-columns (reduce into [] (map :columns dataset-versions))
                    namespaces (set (namespaces-by-op (w/keywordize-keys transformation) (w/keywordize-keys tx-columns)))]
                (doseq [dsv (filter #(contains? namespaces (:namespace %)) dataset-versions)]
                  (db.job-execution/vacuum-table conn (select-keys dsv [:table-name])))
                (recur dataset-versions
                       (rest transformations)
                       applied-txs)))))
        {:dataset-versions dsvs}))))

(defn column-title-error? [column-title columns]
  (when (not-empty (filter #(= column-title (get % "title")) columns))
    {:success? false
     :message  (format "In this dataset there's already a column with this name: %s. Please choose another non existing name" column-title)}))

(defn get-namespace [columns columnName]
  (let [column (first (filter #(= columnName
                                  (or (get % "columnName")
                                      (get % :columnName))) columns))]
    (or (get column "namespace") (get column :namespace) "main")))

(defn get-dsv [dataset-versions namespace]
  (first (filter #(= (:namespace %) namespace) dataset-versions)))

(defn all-columns [dataset-versions]
  (reduce into [] (map :columns (vals dataset-versions))))
