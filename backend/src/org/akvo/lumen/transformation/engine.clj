(ns org.akvo.lumen.transformation.engine
  (:require [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.util :as util])
  (:import java.sql.SQLException))


(hugsql/def-db-fns "org/akvo/lumen/transformation/engine.sql")

(def available-ops
  {"core/change-datatype" nil
   "core/change-column-title" nil
   "core/sort-column" nil
   "core/remove-sort" nil
   "core/filter-column" nil
   "core/to-titlecase" nil
   "core/to-lowercase" nil
   "core/to-uppercase" nil
   "core/trim" nil
   "core/trim-doublespace" nil})

(defn- get-column-name
  "Returns the columnName from the operation specification"
  [op-spec]
  (get-in op-spec ["args" "columnName"]))

(defn- get-column-idx
  "Returns the column index or a given columnName.
  Throws an exception if not found"
  [columns column-name]
  (let [idx (first
             (keep-indexed #(when (= column-name (get %2 "columnName")) %1) columns))]
    (if (nil? idx)
      (throw (Exception. (str "Column " column-name " not found")))
      idx)))

(defn- get-sort-idx
  "Returns the next sort index for a given vector of columns"
  [columns]
  (inc (count (filter #(get % "sort") columns))))

(defmulti column-metadata-operation
  "Dispatch a columns metadata change"
  (fn [columns op-spec]
    (keyword (get op-spec "op"))))

(defmethod column-metadata-operation :default
  [columns op-spec]
  (throw (Exception. (str "Column metadata changes not supported on operation [" (op-spec "op") "]"))))

(defmethod column-metadata-operation :core/sort-column
  [columns op-spec]
  (let [col-name (get-column-name op-spec)
        col-idx (get-column-idx columns col-name)
        sort-idx (get-sort-idx columns)
        sort-direction (get-in op-spec ["args" "sortDirection"])]
    (update columns col-idx assoc "sort" sort-idx "direction" sort-direction)))

(defmethod column-metadata-operation :core/remove-sort
  [columns op-spec]
  (let [col-name (get-column-name op-spec)
        col-idx (get-column-idx columns col-name)]
    (update columns col-idx assoc "sort" nil "direction" nil)))

(defmethod column-metadata-operation :core/change-column-title
  [columns op-spec]
  (let [col-name (get-column-name op-spec)
        col-idx (get-column-idx columns col-name)
        col-title (get-in op-spec ["args" "columnTitle"])]
    (update columns col-idx assoc "title" col-title)))

(defmethod column-metadata-operation :core/change-datatype
  [columns op-spec]
  (let [col-name (get-column-name op-spec)
        col-idx (get-column-idx columns col-name)
        new-type (get-in op-spec ["args" "newType"])]
    (update columns col-idx assoc "type" new-type)))


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
  (fn [tennant-conn table-name dv op-spec]
    (keyword (get op-spec "op"))))

(defmethod apply-operation :default
  [tennant-conn table-name columns op-spec]
  {:success? false
   :message (str "Unknown operation " (get op-spec "op"))})

(defmethod apply-operation :core/to-titlecase
  [tennant-conn table-name columns op-spec]
  (db-to-titlecase tennant-conn {:table-name table-name
                                 :column-name (get-column-name op-spec)})
  {:success? true
   :columns columns})

(defmethod apply-operation :core/to-lowercase
  [tennant-conn table-name columns op-spec]
  (db-to-lowercase tennant-conn {:table-name table-name
                                 :column-name (get-column-name op-spec)})
  {:success? true
   :columns columns})

(defmethod apply-operation :core/to-uppercase
  [tennant-conn table-name columns op-spec]
  (db-to-upercase tennant-conn {:table-name table-name
                                :column-name (get-column-name op-spec)})
  {:success? true
   :columns columns})


(defmethod apply-operation :core/trim
  [tennant-conn table-name columns op-spec]
  (db-trim tennant-conn {:table-name table-name
                         :column-name (get-column-name op-spec)})
  {:success? true
   :columns columns})

(defmethod apply-operation :core/trim-doublespace
  [tennant-conn table-name columns op-spec]
  (db-trim-double tennant-conn {:table-name table-name
                                :column-name (get-column-name op-spec)})
  {:success? true
   :columns columns})

(defmethod apply-operation :core/sort-column
  [tennant-conn table-name columns op-spec]
  (let [col-name (get-column-name op-spec)
        idx-name (str table-name "_" col-name)
        new-cols (column-metadata-operation columns op-spec)]
    (db-create-index tennant-conn {:index-name idx-name
                                   :column-name col-name
                                   :table-name table-name})
    {:success? true
     :columns new-cols}))

(defmethod apply-operation :core/remove-sort
  [tennant-conn table-name columns op-spec]
  (let [col-name (get-column-name op-spec)
        idx-name (str table-name "_" col-name)
        new-cols (column-metadata-operation columns op-spec)]
    (db-drop-index tennant-conn {:index-name idx-name})
    {:success? true
     :columns new-cols}))

(defmethod apply-operation :core/change-column-title
  [tenant-conn table-name columns op-spec]
  (let [new-cols (column-metadata-operation columns op-spec)]
    {:success? true
     :columns new-cols}))


(defmethod apply-operation :core/change-datatype
  [tennant-conn table-name columns op-spec]
  (let [new-cols (column-metadata-operation columns op-spec)]
    (try
      (let [result (db-change-data-type tennant-conn {:table-name table-name
                                                      :args (get op-spec "args")
                                                      :on-error (get op-spec "onError")})
            exec-log (vec (:lumen_change_data_type result))]
        {:success? true
         :execution-log exec-log
         :columns new-cols})
      (catch SQLException e
        {:success? false
         :message (.getMessage e)}))))

(defmethod apply-operation :core/filter-column
  [tenant-conn table-name columns op-spec]
  (try
    (let [expr (first (get-in op-spec ["args" "expression"]))
          expr-fn (first expr)
          expr-val (second expr)
          filter-fn (if (= "is" expr-fn) ;; TODO: logic only valid for text columns
                      "="
                      "ilike")
          filter-val (if (= "contains" expr-fn)
                       (str "\"%" expr-val "%\"")
                       (str "\"" expr-val "\""))
          result (db-filter-column tenant-conn {:table-name table-name
                                                :column-name (get-column-name op-spec)
                                                :filter-fn filter-fn
                                                :filter-val filter-val})]
      {:success? true
       :execution-log [(str "Deleted " result " rows")]
       :columns columns})
    (catch Exception e
      {:success? false
       :message (.getMessage e)})))

(hugsql/def-db-fns "org/akvo/lumen/transformation.sql")

(defn non-applied-transformations
  "Find non-applied transformations."
  [current-transformation-log new-transformation-log]
  (let [current-n (count current-transformation-log)
        new-n (count new-transformation-log)]
    (cond

      ;; Nothing to apply
      (= current-transformation-log new-transformation-log)
      []

      ;; New transformations to apply
      (< current-n new-n)
      (if (= current-transformation-log (take current-n new-transformation-log))
        (drop current-n new-transformation-log) ;; Apply missing transformations
        (throw (ex-info "Could not apply transformation. New transformation log has diverged"
                        {:current-transformation-log current-transformation-log
                         :new-transformation-log new-transformation-log})))

      ;; Undo some transformations
      (< new-n current-n)
      (if (= new-transformation-log (take new-n current-transformation-log))
        new-transformation-log
        (throw (ex-info "Could not apply undo. New transformation log has diverged"
                        {:current-transformation-log current-transformation-log
                         :new-transformation-log new-transformation-log}))))))

(defn execute
  [completion-promise tenant-conn job-id dataset-id new-transformation-log]
  (try
    (let [dataset-version (dataset-version-by-id tenant-conn {:id dataset-id})
          columns (vec (:columns dataset-version))
          current-transformation-log (:transformations dataset-version)
          non-applied-transformation-log (non-applied-transformations current-transformation-log
                                                                      new-transformation-log)
          source-table (if (= non-applied-transformation-log new-transformation-log)
                         (let [table-name (util/gen-table-name "ds")]
                           ;; This is the undo case. Could optimize with periodic snapshots.
                           (copy-table tenant-conn
                                       {:source-table (:imported-table-name dataset-version)
                                        :dest-table table-name}
                                       {}
                                       {:transaction? false})
                           table-name)
                         (:table-name dataset-version))
          f (fn [log op-spec]
              (let [cols (if (empty? log)
                           columns
                           (:columns (last log)))
                    step (apply-operation tenant-conn
                                          source-table
                                          cols
                                          op-spec)]
                (if (:success? step)
                  (conj log step)
                  (throw (ex-info (str "Error applying operation: " op-spec)
                                  {:op-spec op-spec})))))]
      (let [result (reduce f [] non-applied-transformation-log)
            log (vec (mapcat :execution-log result))
            cols (:columns (last result))
            new-dataset-version-id (str (util/squuid))]
        (clear-dataset-version-data-table tenant-conn {:id (:id dataset-version)})
        (new-dataset-version tenant-conn {:id new-dataset-version-id
                                          :dataset-id dataset-id
                                          :job-execution-id job-id
                                          :table-name source-table
                                          :imported-table-name (:imported-table-name dataset-version)
                                          :version (inc (:version dataset-version))
                                          :transformations new-transformation-log
                                          :columns cols})
        (update-job-success-execution tenant-conn {:id job-id
                                                   :exec-log log})
        (deliver completion-promise {:status "OK"
                                     :job-execution-id job-id
                                     :dataset-version-id new-dataset-version-id
                                     :dataset-id dataset-id})))
    (catch Exception e
      (let [msg (.getMessage e)]
        (update-job-failed-execution tenant-conn {:id job-id
                                                  :error-log [msg]})
        (deliver completion-promise {:status "FAILED"
                                     :dataset-id dataset-id
                                     :job-execution-id job-id
                                     :message msg})))))
