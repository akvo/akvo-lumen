(ns org.akvo.dash.transformation.engine
  (:require [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(def available-ops
  {"core/change-datatype" nil
   "core/sort-column" nil
   "core/remove-sort" nil
   "core/filter" nil
   "core/to-titlecase" nil
   "core/to-lowercase" nil
   "core/to-uppercase" nil
   "core/trim" nil
   "core/trim-doublespace" nil})


(hugsql/def-db-fns "org/akvo/dash/transformation/engine.sql")

(defmulti apply-operation
  "Applies a particular operation based on `op` key from spec
   spec is a JSON payload with the following keys:
   - \"op\" : operation to perform
   - \"args\" : map with arguments to the operation
   - \"onError\" : Error strategy"
  (fn [tennant-conn table-name spec]
    (keyword (get spec "op"))))

(defmethod apply-operation :default
  [tennant-conn table-name op-spec]
  {:success? false
   :reason (str "Unknown operation " (op-spec "op"))})

(defmethod apply-operation :core/to-titlecase
  [tennant-conn table-name op-spec]
  (db-to-titlecase tennant-conn {:table-name table-name
                                 :column-name (get-in op-spec ["args" "columnName"])})
  {:success? true})

(defmethod apply-operation :core/to-lowercase
  [tennant-conn table-name op-spec]
  (db-to-lowercase tennant-conn {:table-name table-name
                                 :column-name (get-in op-spec ["args" "columnName"])})
  {:success? true})

(defmethod apply-operation :core/to-uppercase
  [tennant-conn table-name op-spec]
  (db-to-upercase tennant-conn {:table-name table-name
                                :column-name (get-in op-spec ["args" "columnName"])})
  {:success? true})


(defmethod apply-operation :core/trim
  [tennant-conn table-name op-spec]
  (db-trim tennant-conn {:table-name table-name
                         :column-name (get-in op-spec ["args" "columnName"])})
  {:success? true})

(defmethod apply-operation :core/trim-doublespace
  [tennant-conn table-name op-spec]
  (db-trim-double tennant-conn {:table-name table-name
                                :column-name (get-in op-spec ["args" "columnName"])})
  {:success? true})

(defmethod apply-operation :core/sort-column
  [tennant-conn table-name op-spec]
  (let [args (get op-spec "args")]
    (db-create-index tennant-conn {:index-name (str table-name "_" (args "columnName"))
                                   :column-name (args "columnName")
                                   :table-name table-name})))
