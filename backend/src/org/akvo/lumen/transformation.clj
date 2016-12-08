(ns org.akvo.lumen.transformation
  (:require [clojure.string :as str]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.component.transformation-engine :refer (enqueue)]
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
  (throw (ex-info (str "Invalid transformation " op-spec) op-spec)))

(defn required-keys
  [{:strs [op args onError] :as op-spec}]
  (or (boolean (and (ops-set op)
                    (not-empty args)
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

(defmethod validate-op :core/filter-column
  [op-spec]
  (or (boolean (and (required-keys op-spec)
                    (not-empty (get-in op-spec ["args" "expression"]))))
      (throw-invalid-op op-spec)))


(defmethod validate-op :core/combine
  [op-spec]
  (or (boolean (and (every? string? (get-in op-spec ["args" "columnNames"]))
                    (string? (get-in op-spec ["args" "newColumnTitle"]))
                    (string? (get-in op-spec ["args" "separator"]))
                    (= (get op-spec "onError") "fail")))
      (throw-invalid-op op-spec)))

(defmethod validate-op :core/derive
  [op-spec]

  )

(defn validate
  [command]
  (try
    (condp = (:type command)
      :transformation (if (validate-op (:transformation command))
                        {:valid? true}
                        {:valid? false
                         :message (str "Invalid transformation " (:transformation command))})
      :undo {:valid? true}
      {:valid? false
       :message (str "Unknown command " command)})
    (catch Exception e
      {:valid? false
       :message (.getMessage e)})))

(defn schedule
  [tenant-conn transformation-engine dataset-id command]
  (if-let [dataset (dataset-by-id tenant-conn {:id dataset-id})]
    (let [v (validate command)]
      (if (:valid? v)
        (let [job-id (str (squuid))]
          (new-transformation-job-execution tenant-conn {:id job-id
                                                         :dataset-id dataset-id})
          (let [{:keys [status] :as resp} @(enqueue transformation-engine
                                                    {:tenant-conn tenant-conn
                                                     :job-id job-id
                                                     :dataset-id dataset-id
                                                     :command command})]
            (if (= status "OK")
              {:status 200
               :body (dissoc resp :status)}
              {:status 409
               :body (dissoc resp :status)})))
        {:status 400
         :body {:message (:message v)}}))
    {:status 400
     :body {:message "Dataset not found"}}))
