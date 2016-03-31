(ns org.akvo.db-util
  "Make sure we talk Postgres json."
  (:require
   [cheshire.core :as json]
   [clj-time.coerce :as c]
   [clojure.java.jdbc :as jdbc]
   )
  (:import
   java.sql.Timestamp
   org.postgresql.util.PGobject))

;; This is heavily "inspired" by Travis Vachon
;; http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/
;; Difference in that this uses Cheshire.

(defn val->jsonb-pgobj
  [v]
  (doto (PGobject.)
    (.setType "jsonb")
    (.setValue (json/encode v))))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentMap
  (sql-value [v] (val->jsonb-pgobj v))

  clojure.lang.IPersistentVector
  (sql-value [v] (val->jsonb-pgobj v)))

(defn parse-pgobj
  "Parse PGobject to jsonb."
  [pgobj]
  (let [t (.getType pgobj)
        v (.getValue pgobj)]
    (case t
      "json"  (json/decode v)
      "jsonb" (json/decode v)
      :else v)))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj _ _]
    (parse-pgobj pgobj)))

;; Using timestamps, but why not as ISO?
(extend-protocol jdbc/IResultSetReadColumn
  Timestamp
  (result-set-read-column [ts _ _]
    (-> ts
        c/from-sql-time
        c/to-long)))
