(ns akvo.lumen.import.common
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str])
  (:import [org.postgis PGgeometry]))

(defprotocol DatasetImporter
  "
  A protocol for importing datasets into Lumen. A typical implementation
  should also implement `java.io.Closeable` since some data sources are
  backed by resources that need to be released.

  Example:
  (reify
    Closeable
    (close [this])

    DatasetImporter
    (columns [this]
      [{:id :a :type :text :title \"A\"}
       {:id :b :type :number :title \"B\"}
       {:id :c :type :date :title \"C\"}])
    (records [this]
      [{:a \"foo\"
        :b 42
        :c (Instant/now)}
       {:a \"bar\"
        :b 3.14
        :c (Instant/now)}
  "

  (columns [this]
    "Returns a sequence of column specifications of the dataset to be imported.
     A column specification is a map with keys

     Required:
       :type - The lumen type of the column. Currently :text, :number, :date or :geoshape
       :title - The title of the column
       :id - The internal id of the column (as a keyword). The id must be
             lowercase alphanumeric ([a-z][a-z0-9]*)

     Optional:
       :key - True if this column is required to be non-null and unique")
  (records [this]
    "Returns a sequence of record data. A record is a map of column ids to values.
     The type of the value depends on the type of the column where

       :text - java.lang.String
       :number - java.lang.Number
       :date - java.time.Instant
       :geoshape - java.lang.String
                   Well-known text (WKT) shape (POLYGON or MULTIPOLYGON)"))

(defn dispatch-on-kind [spec]
  (let [kind (get spec "kind")]
    (if (#{"LINK" "DATA_FILE"} kind)
      "CSV" ;; TODO: Unify elsewhere
      kind)))

(defmulti dataset-importer
  "Creates a DatasetImporter according to the spec"
  (fn [spec config]
    (dispatch-on-kind spec)))

(defn dataset-table-sql
  [table-name columns]
  (format "create table %s (rnum serial primary key, %s);"
          table-name
          (str/join ", " (map (fn [{:keys [id type]}]
                                (format "%s %s"
                                        (name id)
                                        (condp = type
                                          :date "timestamptz"
                                          :number "double precision"
                                          ;; Note not `POLYGON` so we can support `MULTIPOLYGON` as well
                                          :geoshape "geometry(GEOMETRY, 4326)"
                                          :text "text")))
                              columns))))

(defn create-dataset-table [conn table-name columns]
  (jdbc/execute! conn [(dataset-table-sql table-name columns)]))

(defn add-key-constraints [conn table-name columns]
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

(defrecord Geoshape [wkt-string])

(defprotocol CoerceToSql
  (coerce [this]))

(extend-protocol CoerceToSql
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
      geom)))

(defn coerce-to-sql [record]
  (reduce-kv
   (fn [result k v]
     (assoc result k (when v (coerce v))))
   {}
   record))
