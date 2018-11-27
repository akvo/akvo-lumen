(ns akvo.lumen.postgres
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str])
  (:import [org.postgis Polygon MultiPolygon]
           [org.postgresql.util PGobject]))

(defn val->geometry-pgobj
  [v]
  (doto (PGobject.)
    (.setType "geometry")
    (.setValue (.toString v))))

(extend-protocol jdbc/ISQLValue
  org.postgis.Polygon
  (sql-value [v] (val->geometry-pgobj v))
  org.postgis.MultiPolygon
  (sql-value [v] (val->geometry-pgobj v))
  org.postgis.Point
  (sql-value [v] (val->geometry-pgobj v)))

(defn escape-string [s]
  (when-not (nil? s)
    (when-not (string? s)
      (throw (ex-info "Not a string" {:s s})))
    (str/replace s "'" "''")))

(defn adapt-string-value [v]
  (str "$anylumenthing$" v "$anylumenthing$::TEXT"))
