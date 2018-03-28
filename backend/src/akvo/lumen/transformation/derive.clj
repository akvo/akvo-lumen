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

(defn build-js
  [columns transformation]
  (get-in (reduce (fn [transformation {:strs [id column-name] :as reference}]
                    (let [column-title (-> (filter #(= (get % "columnName")
                                                       column-name)
                                                   columns)
                                           first (get "title"))]
                      (update-in transformation ["prepared" "code"]
                                 #(str/replace % id (format "row['%s']"
                                                            column-title)))))
                  transformation
                  (get-in transformation ["prepared" "references"]))
          ["prepared" "code"]))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (try
    (let [{code "code"
           column-title "newColumnTitle"
           column-type "newColumnType"} (engine/args op-spec)
          on-error (engine/error-strategy op-spec)
          column-name (engine/next-column-name columns)
          transform (row-transform (build-js columns op-spec))
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

(defn row-references
  "Takes JavaScript and return a sequence of string tuples
  [<reference-pattern> <column-title>] e.g. \"row['a'];\" -> ([\"row['a']\"] \"a\")"
  [code]
  (map (fn [[reference-pattern _ column-title _]]
         [reference-pattern column-title])
       (re-seq #"row(\.|\['|\[\")(\w+)('\]|\"\]|)"
               code)))
(comment
  (row-references "row.a") ;; (["row.a" "a"])
  (row-references "row['a'];") ;; (["row['a']" "a"])
  (row-references "row[\"a\"].replace(\"a\", \"b\")") ;; (["row[\"a\"]" "a"])
  (row-references " row.b + row['c'];") ;; (["row.b" "b"] ["row['c']" "c"])
  )


(defmethod engine/pre-hook :core/derive
  [transformation columns]
  (reduce (fn [t [reference-pattern column-title]]
            (let [id (str (util/squuid))
                  column-name (-> (filter (fn [{:strs [title]}]
                                            (= title column-title))
                                          columns)
                                  first
                                  (get "columnName"))]
              (-> (if (nil? (get-in t ["prepared"]))
                    (assoc-in t ["prepared"]
                              {"code" (str/replace (get-in transformation ["args" "code"])
                                                   reference-pattern id)
                               "references" []})
                    (update-in t ["prepared" "code"]
                               #(str/replace % reference-pattern id)))
                  (update-in ["prepared" "references"] #(conj % {"id" id
                                                                 "pattern" reference-pattern
                                                                 "column-name" column-name})))))
          transformation
          (row-references (get-in transformation ["args" "code"]))))

(comment

  (let [columns [{"columnTitle" "A"
                  "columnName" "c1"}
                 {"columnTitle" "B"
                  "columnName" "c2"}
                 {"columnTitle" "C"
                  "columnName" "d1"}]
        transformation {"op" "core/derive"
                        "args" {"code" "row.[' B'];"}
                        "prepared" {"code" "abc123;"
                                    "references" [{"id" "abc123"
                                                   "pattern" "row[' B']"
                                                   "column-name" "c2"}]}}]
    (build-js columns transformation)
    )
  )






(comment
  (let [transform {"op" "core/derive"
                   "args" {"code" "row['a'] + row.b;"}}
        columns [{"title" "a"
                  "columnName" "c1"}
                 {"title" "b"
                  "columnName" "c2"}]]
    (reduce (fn [t ref]
              (let [column-name (-> (filter #(= (get % "title") (second ref))
                                            columns)
                                    first (get "columnName"))
                    id (str (util/squuid))]
                (-> t
                    (assoc-in ["tmap" id] {"pattern" (first ref)})
                    (assoc-in ["tmap" id "column"] column-name)
                    (update-in ["args" "code"] #(str/replace % (first ref) id)))))
            transform
            (parse-code (get-in transform ["args" "code"]))))
  )
