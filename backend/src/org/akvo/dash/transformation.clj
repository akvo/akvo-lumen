(ns org.akvo.dash.transformation
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [org.akvo.dash.transformation.engine :as engine]
            [org.akvo.dash.util :refer (squuid gen-table-name)]))

;; TODO: Potential change op-spec validation `core.spec`

(def ops-set (set (keys engine/available-ops)))
(def on-error-set #{"fail" "default-value" "delete-row"})
(def type-set #{"number" "text" "date"})
(def sort-direction-set #{"ASC" "DESC"})

(hugsql/def-db-fns "org/akvo/dash/transformation.sql")


(defn- throw-invalid-op
  [op-spec]
  (throw (Exception. (str "Invalid operation " op-spec))))

(defn required-keys
  [{:strs [op args onError] :as op-spec}]
  (or (boolean (and (ops-set op)
                    (not-empty args)
                    (re-find #"c\d+" (args "columnName"))
                    (on-error-set onError)))
      (throw-invalid-op op-spec)))

(defmulti validate-op
  (fn [op-spec]
    (keyword (op-spec "op"))))

(defmethod validate-op :default
  [op-spec]
  (throw-invalid-op op-spec))

(defmethod validate-op :core/change-datatype
  [{:strs [op args] :as op-spec}]
  (or (boolean (and (required-keys op-spec)
                 (type-set (args "newType"))
                 (not-empty (args "defaultValue"))
                 (if (= "date" (args "newType"))
                   (not-empty (args "parseFormat"))
                   true)))
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/change-column-title
  [{:strs [args] :as op-spec}]
  (or (boolean (and (required-keys op-spec)
                    (not-empty (args "columnTitle"))))
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/sort-column
  [{:strs [args] :as op-spec}]
  (or (boolean (and (required-keys op-spec)
                    (sort-direction-set (args "sortDirection"))))
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/remove-sort
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/filter
  [op-spec]
  true)

(defmethod validate-op :core/to-titlecase
  [op-spec]
  (required-keys op-spec))

(defmethod validate-op :core/to-lowercase
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/to-uppercase
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/trim
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/trim-doublespace
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defn validate
  [transformations]
  (try
    {:valid? (every? validate-op transformations)}
    (catch Exception e
      {:valid? false
       :message (.getMessage e)})))

(defn execute
  [tenant-conn job-id dataset-id transformations]
  (let [dv (dataset-version-by-id tenant-conn {:id dataset-id})
        columns (vec (:columns dv))
        source-table (:imported-table-name dv)
        table-name (gen-table-name "ds")
        f (fn [log op-spec]
            (let [step (engine/apply-operation tenant-conn
                                               table-name
                                               columns
                                               op-spec)]
              (if (:success? step)
                (conj log step)
                (throw (Exception. (str "Error applying operation: " op-spec))))))]
    (try
      (copy-table tenant-conn {:source-table source-table
                               :dest-table table-name})
      (let [result (reduce f [] transformations)
            log (mapcat :execution-log result)
            cols (:columns (last result))]
        (new-dataset-version tenant-conn {:id (str (squuid))
                                          :dataset-id dataset-id
                                          :job-execution-id job-id
                                          :table-name table-name
                                          :imported-table-name source-table
                                          :version (inc (:version dv))
                                          :columns cols})
        (update-job-success-execution tenant-conn {:id job-id
                                                   :exec-log log}))
      (catch Exception e
        (update-job-failed-execution tenant-conn {:id job-id
                                                  :error-log (.getMessage e)})))))

(defn schedule
  [tenant-conn dataset-id transformations]
  (if-let [dataset (dataset-by-id tenant-conn {:id dataset-id})]
    (let [v (validate transformations)]
      (if (:valid? v)
        (let [job-id (str (squuid))]
          (jdbc/with-db-transaction [tx tenant-conn]
            (new-job-execution tx {:id job-id
                                   :dataset-id dataset-id})
            (update-transformations tx {:transformations transformations
                                        :dataset-id dataset-id}))
          (future
            (execute tenant-conn job-id dataset-id transformations))
          {:status 200
           :jobExecutionId job-id})
        {:status 400
         :body {:message (:message v)}}))
    {:status 400
     :body {:message "Dataset not found"}}))
