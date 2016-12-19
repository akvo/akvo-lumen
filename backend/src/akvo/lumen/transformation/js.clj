(ns akvo.lumen.transformation.js
  (:import [javax.script ScriptEngineManager ScriptEngine Invocable]
           [jdk.nashorn.api.scripting NashornScriptEngineFactory ClassFilter]))

(set! *warn-on-reflection* true)

(defn derive-column-function [code]
  (format "var deriveColumn = function(row) {  return %s; }" code))

(def ^ClassFilter class-filter
  (reify ClassFilter
    (exposeToScripts [this s]
      false)))

(defn row-transform [code]
  (let [factory (NashornScriptEngineFactory.)
        engine (.getScriptEngine factory class-filter)]
    (.eval ^ScriptEngine engine ^String (derive-column-function code))
    (fn [row]
      (.invokeFunction ^Invocable engine "deriveColumn" (object-array [row])))))
