(ns akvo.lumen.transformation
  (:require [akvo.lumen.component.transformation-engine :refer (enqueue)]
            [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.util :refer (squuid)]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(def transformation-namespaces
  '[akvo.lumen.transformation.change-datatype
    akvo.lumen.transformation.text
    akvo.lumen.transformation.sort-column
    akvo.lumen.transformation.filter-column
    akvo.lumen.transformation.combine
    akvo.lumen.transformation.derive
    akvo.lumen.transformation.rename-column
    akvo.lumen.transformation.delete-column])

;; Load transformation namespaces
(apply require transformation-namespaces)

(defn validate
  [command]
  (try
    (condp = (:type command)
      :transformation (if (engine/valid? (:transformation command))
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
