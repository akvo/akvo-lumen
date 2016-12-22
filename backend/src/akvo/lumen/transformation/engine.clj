(ns akvo.lumen.transformation.engine
  (:require [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.walk :as walk]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(defmulti valid?
  "Validate transformation spec"
  (fn [op-spec]
    (keyword (op-spec "op"))))

(defmethod valid? :default
  [op-spec]
  false)

;; TODO remove.
(defmulti column-metadata-operation
  "Dispatch a columns metadata change"
  (fn [columns op-spec]
    (keyword (get op-spec "op"))))

(defmethod column-metadata-operation :default
  [columns op-spec]
  (throw (ex-info (format "Column metadata changes not supported on operation [%s]"
                          (op-spec "op"))
                  {:columns columns
                   :op-spec op-spec})))

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
    (keyword (get op-spec "op"))))

(defmethod apply-operation :default
  [tenant-conn table-name columns op-spec]
  {:success? false
   :message (str "Unknown operation " (get op-spec "op"))})

(defn valid-column-name? [s]
  (boolean (re-find #"^(c|d)\d+$" s)))

(defn valid-type? [s]
  (boolean (#{"text" "number" "date"} s)))

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

(defn next-column-name [columns]
  (let [nums (->> columns
                  (map #(get % "columnName"))
                  (filter #(str/starts-with? % "d"))
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

(defn- execute-transformation-failed [completion-promise tenant-conn dataset-id job-id message]
  (update-job-failed-execution tenant-conn {:id job-id :error-log [message]})
  (deliver-promise-failure completion-promise dataset-id job-id message))

(defn execute-transformation
  [completion-promise tenant-conn job-id dataset-id transformation]
  (try
    (let [dataset-version (latest-dataset-version-by-dataset-id tenant-conn
                                                                {:dataset-id dataset-id})
          columns (vec (:columns dataset-version))
          source-table (:table-name dataset-version)]
      (let [{:keys [success? message columns execution-log]} (apply-operation tenant-conn
                                                                              source-table
                                                                              columns
                                                                              transformation)]
        (if success?
          (let [new-dataset-version-id (str (util/squuid))]
            (clear-dataset-version-data-table tenant-conn {:id (:id dataset-version)})
            (new-dataset-version tenant-conn
                                 {:id new-dataset-version-id
                                  :dataset-id dataset-id
                                  :job-execution-id job-id
                                  :table-name source-table
                                  :imported-table-name (:imported-table-name dataset-version)
                                  :version (inc (:version dataset-version))
                                  :transformations (conj (vec (:transformations dataset-version))
                                                         transformation)
                                  :columns columns})
            (update-job-success-execution tenant-conn {:id job-id :exec-log (vec execution-log)})
            (deliver-promise-success completion-promise dataset-id new-dataset-version-id job-id))
          (execute-transformation-failed completion-promise
                                         tenant-conn dataset-id
                                         job-id
                                         message))))
    (catch Exception e
      (execute-transformation-failed completion-promise
                                     tenant-conn
                                     dataset-id
                                     job-id
                                     (.getMessage e)))))

(defn- nothing-to-undo [completion-promise tenant-conn dataset-id dataset-version-id job-id]
  (update-job-success-execution tenant-conn {:id job-id :exec-log []})
  (deliver-promise-success completion-promise dataset-id dataset-version-id job-id))

(defn- apply-undo [completion-promise tenant-conn job-id dataset-id current-dataset-version]
  (let [imported-table-name (:imported-table-name current-dataset-version)
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
          (new-dataset-version tenant-conn
                               {:id new-dataset-version-id
                                :dataset-id dataset-id
                                :job-execution-id job-id
                                :table-name table-name
                                :imported-table-name (:imported-table-name current-dataset-version)
                                :version (inc (:version current-dataset-version))
                                :transformations (vec
                                                  (butlast
                                                   (:transformations current-dataset-version)))
                                :columns columns})
          (update-job-success-execution tenant-conn {:id job-id :exec-log full-execution-log})
          (deliver-promise-success completion-promise dataset-id new-dataset-version-id job-id))
        (let [{:keys [success? message columns execution-log]}
              (apply-operation tenant-conn table-name columns (first transformations))]
          (if success?
            (recur (rest transformations) columns (into full-execution-log execution-log))
            (execute-transformation-failed completion-promise
                                           tenant-conn
                                           dataset-id
                                           job-id
                                           message)))))))

(defn execute-undo [completion-promise tenant-conn job-id dataset-id]
  (try
    (let [current-dataset-version (latest-dataset-version-by-dataset-id tenant-conn
                                                                        {:dataset-id dataset-id})
          current-version (:version current-dataset-version)]
      (if (= current-version 1)
        (nothing-to-undo completion-promise
                         tenant-conn
                         dataset-id
                         (:id current-dataset-version)
                         job-id)
        (apply-undo completion-promise
                    tenant-conn
                    job-id
                    dataset-id
                    current-dataset-version)))
    (catch Exception e
      (execute-transformation-failed completion-promise
                                     tenant-conn
                                     dataset-id
                                     job-id
                                     (.getMessage e)))))
