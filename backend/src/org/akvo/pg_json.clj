(ns org.akvo.pg-json
  "Make sure we talk Postgres json."
  (:require
   [camel-snake-kebab.core :refer [->kebab-case-keyword ->snake_case_string]]
   [cheshire.core :as json]
   [clj-time.coerce :as c]
   [clojure.pprint :refer [pprint]]
   [clojure.java.jdbc :as jdbc])
  (:import org.postgresql.util.PGobject
           java.sql.Timestamp)
  )

;; This is heavily "inspired" by Travis Vachon
;; http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/
;; Difference in that this uses Cheshire.

(defn val->jsonb-pgobj
  "Return snake_cased PGObject of type json."
  [v]
  (doto (PGobject.)
      (.setType "jsonb")
      (.setValue (json/generate-string v
                                       {:key-fn (fn [k] (->snake_case_string k))}))))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentMap
  (sql-value [v] (val->jsonb-pgobj v))

  clojure.lang.IPersistentVector
  (sql-value [v] (val->jsonb-pgobj v)))

(defn parse-pgobj
  "Parse PGobject to kebab-case-keyword."
  [pgobj]
  (let [t (.getType pgobj)
        v (.getValue pgobj)]
    (case t
      "json"  (json/parse-string v
                                 (fn [k]
                                   (->kebab-case-keyword k)))
      "jsonb" (json/parse-string v
                                 (fn [k]
                                   (->kebab-case-keyword k)))
      :else   v)))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj meta idx]
    (parse-pgobj pgobj)))

;; Using timestamps, but why not as ISO?
(extend-protocol jdbc/IResultSetReadColumn
  Timestamp
  (result-set-read-column [this _ _]
    (-> this
        c/from-sql-time
        c/to-long)))
