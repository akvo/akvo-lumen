(ns org.akvo.dash.transformation
  (:require [clojure.java.jdbc :as jdbc]
            [org.akvo.dash.transformation.engine :as engine]
            [org.akvo.dash.util :refer (squuid gen-table-name)]
            [hugsql.core :as hugsql]))

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

(defmulti valid-op?
  (fn [op-spec]
    (keyword (op-spec "op"))))

(defmethod valid-op? :default
  [op-spec]
  (throw-invalid-op op-spec))

(defmethod valid-op? :core/change-datatype
  [{:strs [op args] :as op-spec}]
  (or (boolean (and (required-keys op-spec)
                 (type-set (args "newType"))
                 (not-empty (args "defaultValue"))
                 (if (= "date" (args "newType"))
                   (not-empty (args "parseFormat"))
                   true)))
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/change-column-title
  [{:strs [args] :as op-spec}]
  (or (boolean (and (required-keys op-spec)
                    (not-empty (args "columnTitle"))))
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/sort-column
  [{:strs [args] :as op-spec}]
  (or (boolean (and (required-keys op-spec)
                    (sort-direction-set (args "sortDirection"))))
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/remove-sort
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/filter
  [op-spec]
  true)

(defmethod valid-op? :core/to-titlecase
  [op-spec]
  (required-keys op-spec))

(defmethod valid-op? :core/to-lowercase
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/to-uppercase
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/trim
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defmethod valid-op? :core/trim-doublespace
  [op-spec]
  (or (required-keys op-spec)
      (throw-invalid-op op-spec)))

(defn valid?
  [transformations]
  (try
    {:valid? (every? valid-op? transformations)}
    (catch Exception e
      {:valid? false
       :message (.getMessage e)})))

(defn execute
  [tenant-conn job-id dataset-id transformations]
  (let [dv (dataset-version-by-id dataset-id)
        columns (vec (:columns dv))
        imported-table (:imported-table-name dv)
        table-name (gen-table-name "ds")
        f (fn [log op-spec]
            (let [step (engine/apply-operation tenant-conn
                                               table-name
                                               columns
                                               op-spec)]
              (if (:success? step)
                (if (:message step)
                  (conj log (:message step))
                  log)
                (throw (Exception. (str "Error applying operation: " op-spec))))))]
    (try
      (copy-table tenant-conn {:source-table imported-table
                               :dest-table table-name})
      (let [result (reduce f [] transformations)]
        (if (every? :success? result)
          (do
            (new-dataset-version tenant-conn {:id (str (squuid))
                                              :dataset-id dataset-id
                                              :job-execution-id job-id
                                              :table-name table-name
                                              :imported-table-name imported-table
                                              :columns (:columns result)})
            (update-job-execution {:id job-id
                                   :status 'SUCCESS'
                                   :log "Some log"}))
          (update-job-execution tenant-conn {:id job-id
                                             :status 'ERROR'
                                             :log "some log"})))
      (catch Exception e
        (update-job-execution tenant-conn {:id job-id
                                           :status 'ERROR'
                                           :log (.getMessage e)})))))

(defn schedule
  [tenant-conn dataset-id transformations]
  (if-let [dataset (dataset-by-id dataset-id)]
    (let [v (valid? transformations)]
      (if (:valid? v)
        (let [job-id (str (squuid))]
          (jdbc/with-db-transaction [tx tenant-conn]
            (new-job-execution tx {:dataset-id dataset-id})
            (update-transformations tx {:transformations transformations
                                        :dataset-id dataset-id}))
          (future
            (execute tenant-conn job-id dataset-id transformations))
          {:status 200
           :job-execution-id job-id})
        {:status 400
         :body (:message v)}))
    {:status 400
     :body "Dataset not found"}))
