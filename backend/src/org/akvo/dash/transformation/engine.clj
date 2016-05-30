(ns org.akvo.dash.transformation.engine
  (:require [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql])
  (:import java.sql.SQLException))


(hugsql/def-db-fns "org/akvo/dash/transformation/engine.sql")

(def available-ops
  {"core/change-datatype" nil
   "core/change-column-title" nil
   "core/sort-column" nil
   "core/remove-sort" nil
   "core/filter" nil
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
    (update-in columns [col-idx] assoc "sort" sort-idx "direction" sort-direction)))

(defmethod column-metadata-operation :core/remove-sort
  [columns op-spec]
  (let [col-name (get-column-name op-spec)
        col-idx (get-column-idx columns col-name)]
    (update-in columns [col-idx] assoc "sort" nil "direction" nil)))

(defmethod column-metadata-operation :core/change-column-title
  [columns op-spec]
  (let [col-name (get-column-name op-spec)
        col-idx (get-column-idx columns col-name)
        col-title (get-in op-spec ["args" "columnTitle"])]
    (update-in columns [col-idx] assoc "title" col-title)))

(defmulti apply-operation
  "Applies a particular operation based on `op` key from spec
   * tenant-conn: Open connection to the database
   * table-name: table on which to operate (ds_<uuid>)
   * dv: in-memory representation of a dataset version
   * op-spec: JSON payload with the operation settings
   spec is a JSON payload with the following keys:
   - \"op\" : operation to perform
   - \"args\" : map with arguments to the operation
   - \"onError\" : Error strategy"
  (fn [tennant-conn table-name dv op-spec]
    (keyword (get op-spec "op"))))

(defmethod apply-operation :default
  [tennant-conn table-name dv op-spec]
  {:success? false
   :message (str "Unknown operation " (op-spec "op"))})

(defmethod apply-operation :core/to-titlecase
  [tennant-conn table-name dv op-spec]
  (db-to-titlecase tennant-conn {:table-name table-name
                                 :column-name (get-column-name op-spec)})
  {:success? true
   :dv dv})

(defmethod apply-operation :core/to-lowercase
  [tennant-conn table-name dv op-spec]
  (db-to-lowercase tennant-conn {:table-name table-name
                                 :column-name (get-column-name op-spec)})
  {:success? true
   :dv dv})

(defmethod apply-operation :core/to-uppercase
  [tennant-conn table-name dv op-spec]
  (db-to-upercase tennant-conn {:table-name table-name
                                :column-name (get-column-name op-spec)})
  {:success? true
   :dv dv})


(defmethod apply-operation :core/trim
  [tennant-conn table-name dv op-spec]
  (db-trim tennant-conn {:table-name table-name
                         :column-name (get-column-name op-spec)})
  {:success? true
   :dv dv})

(defmethod apply-operation :core/trim-doublespace
  [tennant-conn table-name dv op-spec]
  (db-trim-double tennant-conn {:table-name table-name
                                :column-name (get-column-name op-spec)})
  {:success? true
   :dv dv})

(defmethod apply-operation :core/sort-column
  [tennant-conn table-name dv op-spec]
  (let [col-name (get-column-name op-spec)
        idx-name (str table-name "_" col-name)
        new-cols (column-metadata-operation (:columns dv) op-spec)]
    (db-create-index tennant-conn {:index-name idx-name
                                   :column-name col-name
                                   :table-name table-name})
    {:success? true
     :dv (assoc dv :columns new-cols)}))

(defmethod apply-operation :core/remove-sort
  [tennant-conn table-name dv op-spec]
  (let [col-name (get-column-name op-spec)
        idx-name (str table-name "_" col-name)
        new-cols (column-metadata-operation (:columns dv) op-spec)]
    (db-drop-index tennant-conn {:index-name idx-name})
    {:success? true
     :dv (assoc dv :columns new-cols)}))

(defmethod apply-operation :core/change-column-title
  [tenant-conn table-name dv op-spec]
  (let [new-cols (column-metadata-operation (:columns dv) op-spec)]
    {:success true
     :dv (assoc dv :columns new-cols)}))


(defmethod apply-operation :core/change-datatype
  [tennant-conn table-name dv op-spec]
  (let [args (get op-spec "args")]
    (try
      (db-change-data-type tennant-conn {:table-name table-name
                                         :column-name (args "columnName")
                                         :new-type (args "newType")
                                         :default-value (args "defaultValue" "")
                                         :parse-format (args "parseFormat" "")
                                         :on-error (op-spec "onError")})
      {:success? true
       :dv dv}
      (catch SQLException e
        {:success? false
         :message (:cause e)}))))
