(ns org.akvo.pg-json
  "Make sure we talk Postgres json."
  (:require
   [camel-snake-kebab.core :refer :all]
   [cheshire.core :as json]
   [clojure.java.jdbc :as jdbc])
  (:import org.postgresql.util.PGobject))

;; This is heavily "inspired" by Travis Vachon
;; http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/
;; Difference in that this uses Cheshire.

(defn val->json-pgobj
  "Return snake_cased PGObject of type json."
  [v]
  (doto (PGobject.)
      (.setType "jsonb")
      (.setValue (json/generate-string v
                                       {:key-fn (fn [k] (-> k
                                                            name
                                                            ->snake_case))}))))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentMap
  (sql-value [v] (val->json-pgobj v))

  clojure.lang.IPersistentVector
  (sql-value [v] (val->json-pgobj v)))

(defn parse-pgobj
  "Parse PGobject to kebab-case-keyword."
  [pgobj]
  (let [t (.getType pgobj)
        v (.getValue pgobj)]
    (case t
      "jsonb" (json/parse-string v
                                 (fn [k]
                                   (->kebab-case-keyword k)))
      "json" (json/parse-string v
                                (fn [k]
                                  (->kebab-case-keyword k)))
      :else  v)))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj meta idx]
    (parse-pgobj pgobj)))
