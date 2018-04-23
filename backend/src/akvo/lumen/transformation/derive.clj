(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql])
  (:import [javax.script ScriptEngineManager ScriptEngine Invocable ScriptContext Bindings]
           [jdk.nashorn.api.scripting NashornScriptEngineFactory ClassFilter]))


(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn derive-column-function
  "A string that declares the provided JavaScript code as a var bound to
  deriveColumn."
  [code]
  (format "var deriveColumn = function(row) {  return %s; }" code))

(def ^ClassFilter class-filter
  (reify ClassFilter
    (exposeToScripts [this s]
      false)))

(defn remove-bindings [^Bindings bindings]
  (doseq [function ["print" "load" "loadWithNewGlobal" "exit" "quit" "eval"]]
    (.remove bindings function)))

(defn row-transform
  "Provided JavaScript code returns a Clojure function to get used as row
  transform."
  [code]
  (let [factory (NashornScriptEngineFactory.)
        engine (.getScriptEngine factory class-filter)
        bindings (.getBindings engine ScriptContext/ENGINE_SCOPE)]
    (remove-bindings bindings)
    (.eval ^ScriptEngine engine ^String (derive-column-function code))
    (fn [row]
      (.invokeFunction ^Invocable engine "deriveColumn" (object-array [row])))))

;; This should be updated using Nashorns Parse functionallity,
(defn valid?
  "Checks the provided code and makes sure it's valid. "
  [code]
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

(defn column-title
  [columns column-name]
  (-> (filter #(= (get % "columnName") column-name)
              columns)
      first
      (get "title")))

(defn construct-code
  "Replace column references and fall back to use code pattern if there is no
  references."
  [columns transformation]
  (reduce (fn [code {:strs [column-name id pattern]}]
            (let [column-title (column-title columns column-name)]
              (if column-name
                (str/replace code id (format "row['%s']" column-title))
                (str/replace code id pattern))))
          (get-in transformation ["computed" "template"])
          (get-in transformation ["computed" "references"])))


(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (try
    (let [{code "code"
           column-title "newColumnTitle"
           column-type "newColumnType"} (engine/args op-spec)
          on-error (engine/error-strategy op-spec)
          column-name (engine/next-column-name columns)
          transform (row-transform (construct-code columns op-spec))
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
                (handle-transform-exception e conn on-error table-name column-name (:rnum row)))))))
      {:success? true
       :execution-log [(format "Derived columns using '%s'" code)]
       :columns (conj columns {"title" column-title
                               "type" column-type
                               "sort" nil
                               "hidden" false
                               "direction" nil
                               "columnName" column-name})})
    (catch Exception e
      (log/debug e)
      {:success? false
       :message (format "Failed to transform: %s" (.getMessage e))})))

(defn parse-row-object-references
  "Parse js code and return a sequence of row-references e.g. row.foo row['foo']
  or row[\"foo\"]. For every reference return a tuple with matched pattern and
  the row column as in [\"row.foo\" \"foo\"]."
  [code]
  (let [re #"(?U)row.([\w\d]+)|row\['([\w\d\.\s\p{S}%&]+)'\]|row\[\"([\w\d\.\s\p{S}%&]+)\"\]"
        refs (map #(remove nil? %) (re-seq re code))]
    (if (empty? refs)
      `([~code ~code])
      refs)))

(defn column-name
  "Based on column definitions and title get the column name"
  [columns column-title]
  (-> (filter (fn [{:strs [title]}]
                (= title column-title))
              columns)
      first
      (get "columnName")))

(defn computed
  ""
  [transformation columns]
  (let [code (get-in transformation ["args" "code"])]
    (reduce (fn [m [pattern column-title]]
              (let [id (str (util/squuid))]
                (-> m
                    (update-in ["template"] #(str/replace % pattern id))
                    (update-in ["references"]
                               #(conj % {"id" id
                                         "pattern" pattern
                                         "column-name" (column-name columns
                                                                    column-title)})))))
            {"template" code
             "references" []}
            (parse-row-object-references code))))


(defmethod engine/pre-hook :core/derive
  [transformation columns]
  (assoc transformation "computed" (computed transformation columns)))
