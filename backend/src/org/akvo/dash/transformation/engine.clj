(ns org.akvo.dash.transformation.engine
  (:import [javax.script ScriptEngine ScriptEngineManager])
  (:require [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "org/akvo/dash/transformation/engine.sql")

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
  (js-eval engine (str "Number(" value ")")))

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

(comment

  (import 'java.sql.DriverManager)
  (Class/forName "org.postgresql.Driver")
  (def conn (DriverManager/getConnection "jdbc:postgresql://localhost/dash_tenant_1?user=dash&password=password"))
  (def e (get-engine))

  (time
   (let [e (get-engine)
         db {:connection conn}]
     (jdbc/with-db-transaction [tx db]
       (doseq [row (select-col-1 db)]
         (update-col-1 tx {:rnum (:rnum row) :c1 (to-number e (:c1 row))})))))

  ;; "Elapsed time: 3031769.947961 msecs" - 50.529 min

  (time
   (let [e (get-engine)
         db {:connection conn}]
     (for [r (select-col-1 db)]
       {:rnum (:rnum r) :c1 (to-number e (:c1 r))})))

  ;; "Elapsed time: 6084.714584 msecs"
  ;; "Elapsed time: 5986.01587 msecs"
  ;; "Elapsed time: 6020.817246 msecs"

  (time
   (let [e (get-engine)
         db {:connection conn}]
     (doseq [r (select-col-1 db)]
       (update-col-1 db {:rnum (:rnum r) :c1 (to-number e (:c1 r))}))))

  ;; "Elapsed time: 3554636.151036 msecs" - 59.244 min

  )
