(ns org.akvo.dash.pg-json
  "Make sure we talk Postgres JSON"
  (:require [cheshire.core :as json]
            [clojure.pprint :refer [pprint]]
            [clojure.java.jdbc :as jdbc])
  (:import org.postgresql.util.PGobject
           java.sql.Timestamp))

;; This is heavily "inspired" by Travis Vachon
;; http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/
;; Difference in that this uses Cheshire.

(defn val->json-pgobj
  "Return PGObject of type json"
  [v]
  (-> (PGobject.)
      (.setType "json")
      (.setValue (json/generate-string v))))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentMap
  (sql-value [v] (val->json-pgobj v))

  clojure.lang.IPersistentVector
  (sql-value [v] (val->json-pgobj v)))

(defn parse-pgobj
  [pgobj]
  (let [t (.getType pgobj)
        v (.getValue pgobj)]
    (pprint t)
    (pprint v)
    (case t
      "json" (json/parse-string v (fn [k] (keyword k)))
      :else  v)))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj meta idx]
    (parse-pgobj pgobj)))
