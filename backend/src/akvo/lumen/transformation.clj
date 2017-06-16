(ns akvo.lumen.transformation
  (:require [akvo.lumen.component.transformation-engine :refer (enqueue)]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.util :refer (squuid)]
            [clojure.java.jdbc :as jdbc]
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
  [tenant-conn dataset-id command]
  (if-let [dataset (dataset-by-id tenant-conn {:id dataset-id})]
    (let [v (validate command)]
      (if (:valid? v)
        (try
          (jdbc/with-db-transaction [tx-conn tenant-conn]
            (condp = (:type command)
              :transformation (engine/execute-transformation tx-conn dataset-id (:transformation command))
              :undo (engine/execute-undo tenant-conn dataset-id)))
          (catch Exception e
            ;; Call sentry!
            (lib/conflict {})))
        (lib/bad-request {:message (:message v)})))
    (lib/bad-request {:message "Dataset not found"})))
