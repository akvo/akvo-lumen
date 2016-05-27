(ns org.akvo.dash.transformation
  (require [org.akvo.dash.transformation.engine :refer [available-ops]]))



;; TODO: Potential change op-spec validation `core.spec`

(def ops-set (set (keys available-ops)))
(def on-error-set #{"fail" "default-value" "delete-row"})
(def type-set #{"number" "text" "date"})
(def sort-direction-set #{"ASC" "DESC"})

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
       :message (:cause e)})))

(defn schedule
  [tenant-conn transformations]
  (let [v (valid? transformations)]
    (if (:valid? v)
      {:status 200
       :body "job-id"}
      {:status 400
       :body (:message v)})))
