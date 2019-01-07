(ns akvo.lumen.postgres
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [akvo.lumen.protocols :as p])
  (:import [org.postgis Polygon MultiPolygon PGgeometry]
           [org.postgresql.util PGobject]))

(defn escape-string [s]
  (when-not (nil? s)
    (when-not (string? s)
      (throw (ex-info "Not a string" {:s s})))
    (str/replace s "'" "''")))

(defn adapt-string-value [v]
  (str "$anylumenthing$" v "$anylumenthing$::TEXT"))

(defn- val->geometry-pgobj
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

(defn- index-name [table-name column-name]
  (format "%s_%s_idx" table-name column-name))

(defn geo-index [table-name column-name]
  (format "CREATE INDEX %s ON %s USING GIST(%s)"
          (index-name table-name column-name)
          table-name
          column-name))

(defn- create-indexes [conn table-name columns]
  (doseq [column columns]
    (condp = (:type column)
      "geoshape"
      (jdbc/execute! conn (geo-index table-name (name (:id column))))
      "geopoint"
      (jdbc/execute! conn (geo-index table-name (name (:id column))))

      ;; else
      nil)))

(defn- add-key-constraints [conn table-name columns]
  (doseq [column columns
          :when (:key column)]
    (jdbc/execute! conn
                   (format "ALTER TABLE \"%s\" ADD UNIQUE (%s)"
                           table-name
                           (name (:id column))))
    (jdbc/execute! conn
                   (format "ALTER TABLE \"%s\" ALTER COLUMN %s SET NOT NULL"
                           table-name
                           (name (:id column))))))

(defn- column-type-fn [{:keys [id type]}]
  (format "%s %s"
          (name id)
          (condp = type
            "date" "timestamptz"
            "number" "double precision"
            ;; Note not `POLYGON` so we can support `MULTIPOLYGON` as well
            "geoshape" "geometry(GEOMETRY, 4326)"
            "geopoint" "geometry(POINT, 4326)"
            "multiple" "text"
            "text" "text")))

(defn create-dataset-table [conn table-name columns]
  (jdbc/execute! conn [(format "create table %s (rnum serial primary key, %s);"
                               table-name
                               (str/join ", " (map column-type-fn columns)))])
  (create-indexes conn table-name columns)
  (add-key-constraints conn table-name columns))

(defrecord Geoshape [wkt-string])

(defrecord Geopoint [wkt-string])

(defmethod clojure.core/print-method Geopoint
     [system ^java.io.Writer writer]
  (.write writer "#<Geopoint>"))

(defmethod clojure.core/print-method Geoshape
     [system ^java.io.Writer writer]
     (.write writer "#<Geoshape>"))

(extend-protocol p/CoerceToSql
  java.lang.String
  (coerce [value] value)
  java.lang.Number
  (coerce [value] value)
  java.time.Instant
  (coerce [value]
    (java.sql.Timestamp. (.toEpochMilli value)))
  Geoshape
  (coerce [value]
    (let [geom (PGgeometry/geomFromString (:wkt-string value))]
      (.setSrid geom 4326)
      geom))
  Geopoint
  (coerce [value]
    (let [geom (PGgeometry/geomFromString (:wkt-string value))]
      (.setSrid geom 4326)
      geom)))

(defn coerce-to-sql [record]
  (reduce-kv
   (fn [result k v]
     (assoc result k (when v (p/coerce v))))
   {}
   record))
