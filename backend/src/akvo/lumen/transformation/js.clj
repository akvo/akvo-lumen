(ns akvo.lumen.transformation.js
  (:require [clojure.string :as str])
  (:import [javax.script ScriptEngineManager ScriptEngine Invocable ScriptContext Bindings]
           [jdk.nashorn.api.scripting NashornScriptEngineFactory ClassFilter]))

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
