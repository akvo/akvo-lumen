(ns akvo.lumen.lib.import.csv
  (:require [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.util :as util]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [cuerdas.core :as string])
  (:import [org.apache.tika.detect AutoDetectReader]))

(defn transform-value
  "Transforms the given value according to its associated type label.
  Blank strings are cast to nil. Numeric strings are cast to numbers"
  [value type]
  (cond
    (string/blank? value) nil
    (= type "number") (Double/parseDouble value)
    (= type "geoshape") (postgres/->Geoshape value)
    :else value))

(defn gen-column-titles
  "Returns a seq of alphanumeric column titles of the form
  Column 1, Column 2, Column 3, ... for the given number of columns"
  [num-cols]
  (let [num-range (range 1 (inc num-cols))]
    (->> (map vector (repeat "Column ") num-range)
         (map string/join))))

(defn numeric? [s]
  (or (string/blank? s)
      (string/numeric? s)))

(defn wkt-shape? [s]
  (or (string/starts-with? s "MULTIPOLYGON")
      (string/starts-with? s "POLYGON")))

(defn get-column-types
  "Returns a seq of types for each column in the given rows"
  [rows]
  (for [column-data (apply map vector rows)]
    (condp every? column-data
      numeric? "number"
      wkt-shape? "geoshape"
      "text")))

(defn get-column-tuples
  "Returns a seq of maps containing column id, titles & types.

  Example output:

  [{:id :c1 :title \"Column 1\" :type \"text\"} ...]
  "
  [column-titles column-types]
  (mapv (fn [idx title type]
          {:id (str "c" (inc idx))
           :title title
           :type type})
        (range)
        column-titles
        column-types))

(defn data-records [column-spec rows]
  (for [row rows]
    (apply merge
           (map (fn [{:keys [id type]} value]
                  {id (transform-value value type)})
                column-spec
                row))))

(defn get-column-count [data]
  (let [counts (distinct (map count data))]
    (if (= 1 (count counts))
      (first counts)
      (throw (ex-info "Invalid csv file. Varying number of columns" {})))))

(defn csv-importer [path headers? guess-types?]
  (let [reader (-> path io/input-stream AutoDetectReader.)
        data (csv/read-csv reader)
        column-count (get-column-count data)
        column-titles (if headers?
                        (first data)
                        (gen-column-titles column-count))
        rows (if headers? (rest data) data)
        column-types (if guess-types?
                       (get-column-types rows)
                       (repeat column-count "text"))
        column-spec (get-column-tuples column-titles column-types)]
    (reify
      p/DatasetImporter
      (columns [this] column-spec)
      (records [this]
        (data-records column-spec rows))
      java.io.Closeable
      (close [this]
        (.close reader)))))

(defmethod import/dataset-importer "CSV"
  [spec {:keys [file-upload-path]}]
  (let [path (util/get-path spec file-upload-path)
        headers? (boolean (get spec "hasColumnHeaders"))
        guess-types? (-> (get spec "guessColumnTypes") false? not)]
    (csv-importer path headers? guess-types?)))
