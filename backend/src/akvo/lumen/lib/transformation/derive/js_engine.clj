(ns akvo.lumen.lib.transformation.derive.js-engine
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.string :as str]
            [clojure.tools.logging :as log])
  (:import [javax.script ScriptEngineManager ScriptEngine Invocable ScriptContext Bindings]
           [jdk.nashorn.api.scripting NashornScriptEngineFactory ClassFilter]
           [java.lang Double]))

(defn- throw-invalid-return-type [value]
  (throw (ex-info "Invalid return type"
                  {:value value
                   :type (type value)})))

(defn- column-function [fun code]
  (format "var %s = function(row) {  return %s; }" fun code))

(defn- valid-type? [value type]
  (when-not (nil? value)
    (condp = type
      "number" (if (and (number? value)
                        (if (float? value)
                          (Double/isFinite value)
                          true))
                 (Double/parseDouble (format "%.3f" value))
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

(def ^ClassFilter class-filter
  (reify ClassFilter
    (exposeToScripts [this s]
      false)))

(defn- remove-bindings [^Bindings bindings]
  (doseq [function ["print" "load" "loadWithNewGlobal" "exit" "quit" "eval"]]
    (.remove bindings function)))

(defn- column-name->column-title
  "replace column-name by column-title"
  [columns]
  (let [key-translation (->> columns
                             (map (fn [{:strs [columnName title]}]
                                    [(keyword columnName) title]))
                             (into {}))]
    #(clojure.set/rename-keys % key-translation)))

(defn- js-factory [] (NashornScriptEngineFactory.))

(defn- js-engine
  ([]
   (js-engine (js-factory)))
  ([factory]
   (let [engine (.getScriptEngine factory (into-array String ["--no-deprecation-warning"]) nil class-filter)]
     (remove-bindings (.getBindings engine ScriptContext/ENGINE_SCOPE))
     engine)))

(defn eval*
  ([^String code]
   (eval* (js-engine) code))
  ([^ScriptEngine engine ^String code]
   (.eval ^ScriptEngine engine ^String code)))

(defn- invoke* [^Invocable engine ^String fun & args]
  (.invokeFunction engine fun (object-array args)))

(defn row-transform-fn
  [{:keys [columns code column-type]}]
  (let [adapter (column-name->column-title columns)
        engine (js-engine)
        fun-name "deriveColumn"]
    (eval* engine (column-function fun-name code))
    (fn [row]
      (let [res (->> row
                     (adapter)
                     (invoke* engine fun-name))]
        (if (some? column-type)
          (valid-type? res column-type)
          res)))))

(defn evaluable? [code]
  (and (not (str/includes? code "function"))
       (not (str/includes? code "=>"))
       (let [try-code (column-function "try_js_sintax" code)]
         (try
           (eval* (js-engine) try-code)
           true
           ;; Catches syntax errors
           (catch Exception e
             (log/warn :not-valid-js try-code)
             false)))))
