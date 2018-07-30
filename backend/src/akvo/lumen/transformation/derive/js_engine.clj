(ns akvo.lumen.transformation.derive.js-engine
  (:require [akvo.lumen.util :refer (time*)]
            [clojure.set :as set]
            [clojure.string :as str]
            [clojure.tools.logging :as log])
  (:import [java.util.concurrent Executors]
           [delight.nashornsandbox NashornSandboxes NashornSandbox]
           [delight.nashornsandbox.exceptions ScriptAbuseException]
           [javax.script ScriptEngine Invocable]))

(defn- throw-invalid-return-type [value]
  (throw (ex-info "Invalid return type"
                  {:value value
                   :type (type value)})))

(defn- column-function
  ([fun code explicit-return?]
   (format "var %s = function(row) { %s }" fun (if explicit-return?
                                                 (format "return  %s;" code)
                                                 code)))
  ([fun code]
   (column-function fun code true)))

(defn- valid-type? [value type]
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

(defn ^NashornSandbox js-engine []
  (time* :js-engine 
         (let [maxmemory (* 50 1024 1024) ;; 50Mb
               maxtime   2000]
           (doto (NashornSandboxes/create)
             (.allowReadFunctions false)
             (.allowLoadFunctions false)
             (.allowPrintFunctions false)
             (.allowExitFunctions false)
             (.allowGlobalsObjects false)
             
             (.setMaxMemory maxmemory)
             (.setMaxCPUTime maxtime)

             ;; Specifies the executor service which is used to run scripts when a CPU time limit is specified.
             (.setExecutor (Executors/newSingleThreadExecutor))))))

(defn- column-name->column-title
  "replace column-name by column-title"
  [columns]
  (let [key-translation (->> columns
                             (map (fn [{:strs [columnName title]}]
                                    [(keyword columnName) title]))
                             (into {}))]
    #(set/rename-keys % key-translation)))

(defn- eval*
  ([^NashornSandbox engine ^String code]
   (.eval ^NashornSandbox engine ^String code)))

(defn- invoke* [^Invocable invocable-engine ^String fun & args]
  (.invokeFunction invocable-engine fun (object-array args)))

(defn- invocation
  ([engine fun]
   (invocation engine fun nil))
  ([engine fun type*]
   (fn [& args]
     (let [res (apply invoke* (.getSandboxedInvocable engine) fun args)]
       (if (some? type*)
         (valid-type? res type*)
         res)))))

(defn evaluable? [code]
  (let [try-code (column-function "try_js_sintax" code)]
    (try
      (eval* (js-engine) try-code)
      true
      ;; Catches syntax errors
      (catch Exception e
        (log/warn e :not-valid-js try-code)
        false))))

(defn row-fn
  [{:keys [columns code column-type]}]
  (let [adapter (column-name->column-title columns)
        engine (js-engine)
        fun-name "deriveColumn"
        typed-invocation (invocation engine fun-name column-type)]
    (eval* engine (column-function fun-name code))
    (fn [row]
      (try
        (let [v (->> row (adapter) (typed-invocation))]
          (log/debug :row-fn-success [(:rnum row) v])
          [:success (:rnum row) v])
        (catch ScriptAbuseException e
          (do
            (log/debug e :row-fn-fail (:rnum row) e)
            [:fail-cpu-limits (:rnum row) e]))
        (catch Exception e
          (do
            (log/debug e :row-fn-fail (:rnum row) e)
            [:fail (:rnum row) e]))))))
