(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as str]
            [hugsql.core :as hugsql])
  (:import [javax.script ScriptEngineManager ScriptEngine Invocable ScriptContext Bindings]
           [jdk.nashorn.api.scripting NashornScriptEngineFactory ClassFilter]))

(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn derive-column-function [code]
  (format "var deriveColumn = function(row) {  return %s; }" code))

(def ^ClassFilter class-filter
  (reify ClassFilter
    (exposeToScripts [this s]
      false)))

(defn remove-bindings [^Bindings bindings]
  (doseq [function ["print" "load" "loadWithNewGlobal" "exit" "quit" "eval"]]
    (.remove bindings function)))

(defn row-transform [code]
  (let [factory (NashornScriptEngineFactory.)
        engine (.getScriptEngine factory class-filter)
        bindings (.getBindings engine ScriptContext/ENGINE_SCOPE)]
    (remove-bindings bindings)
    (.eval ^ScriptEngine engine ^String (derive-column-function code))
    (fn [row]
      (.invokeFunction ^Invocable engine "deriveColumn" (object-array [row])))))

(defn valid? [code]
  (boolean
   (and (not (str/includes? code "function"))
        (not (str/includes? code "=>"))
        (try (row-transform code)
             ;; Catches syntax errors
             (catch Exception e
               false)))))

(defn throw-invalid-return-type [value]
  (throw (ex-info "Invalid return type"
                  {:value value
                   :type (type value)})))

(defn ensure-valid-value-type [value type]
  (when-not (nil? value)
    (condp = type
      "number" (if (and (number? value)
                        (if (float? value)
                          (java.lang.Double/isFinite value)
                          true))
                 value
                 (throw-invalid-return-type value))
      "text" (if (string? value)
               value
               (throw-invalid-return-type value))
      "date" (cond
               (number? value)
               (java.sql.Timestamp. (long value))

               (and (instance? jdk.nashorn.api.scripting.ScriptObjectMirror value)
                    (.containsKey value "getTime"))
               (java.sql.Timestamp. (long (.callMember value "getTime" (object-array 0))))

               :else
               (throw-invalid-return-type value)))))

(defn handle-transform-exception
  [exn conn on-error table-name column-name rnum]
  (condp = on-error
    "leave-empty" (set-cell-value conn {:table-name table-name
                                        :column-name column-name
                                        :rnum rnum
                                        :value nil})
    "fail" (throw exn)
    "delete-row" (delete-row conn {:table-name table-name
                                   :rnum rnum})))

(defn lumen->pg-type [type]
  (condp = type
    "text" "text"
    "number" "double precision"
    "date" "timestamptz"))

(defmethod engine/valid? :core/derive
  [op-spec]
  (let [{code "code"
         column-title "newColumnTitle"
         column-type "newColumnType"} (engine/args op-spec)
        on-error (engine/error-strategy op-spec)]
    (and (string? column-title)
         (engine/valid-type? column-type)
         (#{"fail" "leave-empty" "delete-row"} on-error)
         (valid? code))))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (try
    (let [{code "code"
           column-title "newColumnTitle"
           column-type "newColumnType"} (engine/args op-spec)
          on-error (engine/error-strategy op-spec)
          column-name (engine/next-column-name columns)
          transform (row-transform code)
          key-translation (into {}
                                (map (fn [{:strs [columnName title]}]
                                       [(keyword columnName) title])
                                     columns))]
      (let [data (->> (all-data tenant-conn {:table-name table-name})
                      (map #(set/rename-keys % key-translation)))]
        (jdbc/with-db-transaction [conn tenant-conn]
          (add-column conn {:table-name table-name
                            :column-type (lumen->pg-type column-type)
                            :new-column-name column-name})
          (doseq [row data]
            (try
              (set-cell-value conn {:table-name table-name
                                    :column-name column-name
                                    :rnum (:rnum row)
                                    :value (ensure-valid-value-type (transform row)
                                                                    column-type)})
              (catch Exception e
                (handle-transform-exception e conn on-error table-name column-name (:rnum row))))))
        #_(let [statement-sql (format "SELECT * FROM %s" table-name)
                sql-string "select * from pg_prepared_statements where statement = ?"]
            (when (not (empty? (jdbc/query tenant-conn [sql-string statement-sql])))
              (jdbc/execute! tenant-conn "DEALLOCATE ALL"))))
      {:success? true
       :execution-log [(format "Derived columns using '%s'" code)]
       :columns (conj columns {"title" column-title
                               "type" column-type
                               "sort" nil
                               "hidden" false
                               "direction" nil
                               "columnName" column-name})})
    (catch Exception e
      {:success? false
       :message (format "Failed to transform: %s" (.getMessage e))})))
