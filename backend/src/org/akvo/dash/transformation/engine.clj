(ns org.akvo.dash.transformation.engine
  (:import [javax.script ScriptEngine ScriptEngineManager]))

(defn get-engine
  "Returns a Nashorn engine capable of evaluating
  JavaScript code"
  []
  (let [engine (->
                (ScriptEngineManager.)
                (.getEngineByName "nashorn"))]
    ;; http://stackoverflow.com/a/196991
    (.eval engine "function toTitleCase (str) {
    return str.replace(/\\w\\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};")
    engine))

(defn js-eval
  [engine expr]
  (.eval ^ScriptEngine engine expr))

(defn to-number
  [engine value]
  (js-eval engine (str "+" value)))

(defn to-string
  [engine value]
  (js-eval engine (str "''+" value)))

(defn to-lowercase
  [engine value]
  (js-eval engine (str "'" value "'.toLowerCase()")))

(defn to-uppercase
  [engine value]
  (js-eval engine (str "'" value "'.toUpperCase()")))

(defn to-titlecase
  [engine value]
  (js-eval engine (str "toTitleCase('" value "')")))
