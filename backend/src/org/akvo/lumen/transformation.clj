(ns org.akvo.lumen.transformation
  (:require [clojure.string :as str]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.transformation.engine :as engine]
            [org.akvo.lumen.util :refer (squuid gen-table-name)]))

;; TODO: Potential change op-spec validation `core.spec`
;; TODO: Move the validation part to transformation.validation namespace

(def ops-set (set (keys engine/available-ops)))
(def on-error-set #{"fail" "default-value" "delete-row"})
(def type-set #{"number" "text" "date"})
(def sort-direction-set #{"ASC" "DESC"})

(hugsql/def-db-fns "org/akvo/lumen/transformation.sql")


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
  [transformation-log]
  (try
    {:valid? (every? validate-op transformation-log)}
    (catch Exception e
      {:valid? false
       :message (.getMessage e)})))

(defn execute
  [tenant-conn job-id dataset-id transformation-log]
  (let [dv (dataset-version-by-id tenant-conn {:id dataset-id})
        columns (vec (:columns dv))
        source-table (:imported-table-name dv)
        table-name (gen-table-name "ds")
        f (fn [log op-spec]
            (let [cols (if (empty? log)
                         columns
                         (:columns (last log)))
                  step (engine/apply-operation tenant-conn
                                               table-name
                                               cols
                                               op-spec)]
              (if (:success? step)
                (conj log step)
                (throw (Exception. (str "Error applying operation: " op-spec))))))]
    (try
      (copy-table tenant-conn
                  {:source-table source-table
                   :dest-table table-name}
                  {}
                  :transaction? false)
      (let [result (reduce f [] transformation-log)
            log (vec (mapcat :execution-log result))
            cols (:columns (last result))]
        (new-dataset-version tenant-conn {:id (str (squuid))
                                          :dataset-id dataset-id
                                          :job-execution-id job-id
                                          :table-name table-name
                                          :imported-table-name source-table
                                          :version (inc (:version dv))
                                          :transformations transformation-log
                                          :columns cols})
        (update-job-success-execution tenant-conn {:id job-id
                                                   :exec-log log}))
      (catch Exception e
        (update-job-failed-execution tenant-conn {:id job-id
                                                  :error-log [(.getMessage e)]})))))

(defn schedule
  [tenant-conn dataset-id transformation-log]
  (if-let [dataset (dataset-by-id tenant-conn {:id dataset-id})]
    (let [v (validate transformation-log)]
      (if (:valid? v)
        (let [job-id (str (squuid))]
          (new-transformation-job-execution tenant-conn {:id job-id
                                                         :dataset-id dataset-id})
          (future
            (execute tenant-conn job-id dataset-id transformation-log))
          {:status 200
           :body {:jobExecutionId job-id}})
        {:status 400
         :body {:message (:message v)}}))
    {:status 400
     :body {:message "Dataset not found"}}))
