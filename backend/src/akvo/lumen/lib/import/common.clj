(ns akvo.lumen.lib.import.common
  (:require [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [akvo.lumen.protocols :as p]
            [org.akvo.resumed :as resumed])
  (:import [org.postgis PGgeometry]))

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
                                          :geopoint "geometry(POINT, 4326)"
                                          :multiple "text"
                                          :text "text")))
                              columns))))

(defn index-name [table-name column-name]
  (format "%s_%s_idx" table-name column-name))

(defn geo-index [table-name column-name]
  (format "CREATE INDEX %s ON %s USING GIST(%s)"
          (index-name table-name column-name)
          table-name
          column-name))

(defn create-indexes [conn table-name columns]
  (doseq [column columns]
    (condp = (:type column)
      :geoshape
      (jdbc/execute! conn (geo-index table-name (name (:id column))))
      :geopoint
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

(defn create-dataset-table [conn table-name columns]
  (jdbc/execute! conn [(dataset-table-sql table-name columns)])
  (create-indexes conn table-name columns)
  (add-key-constraints conn table-name columns))

(defrecord Geoshape [wkt-string])

(defrecord Geopoint [wkt-string])

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

(defn get-path
  [spec file-upload-path]
  (or (get spec "path")
      (let [file-on-disk? (contains? spec "fileName")
            url (get spec "url")]
        (if file-on-disk?
          (resumed/file-for-upload file-upload-path url)
          (let [url (io/as-url url)]
            (when-not (#{"http" "https"} (.getProtocol url))
              (throw (ex-info (str "Invalid url: " url) {:url url})))
            url)))))

(defn coerce [type-fun questions]
  (map (fn [q]
         {:title (:name q)
          :type (type-fun q)
          :id (keyword (format "c%s" (:id q)))})
       questions))
