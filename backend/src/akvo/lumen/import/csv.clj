(ns akvo.lumen.import.csv
  (:require [akvo.lumen.import.common :as import]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [cuerdas.core :as string])
  (:import com.ibm.icu.text.CharsetDetector))


(defn transform-value
  "Transforms the given value according to its associated type label.
  Numeric strings are cast to numbers, only if the type label matches."
  [[value type-label]]
  (cond
    (string/blank? value) nil
    (and (string/numeric? value) (= "double precision" type-label)) (Double/parseDouble value)
    :else value))

(defn transform-rows
  "Transform values in the given rows based on the given column types"
  [rows column-types]
  (let [value-type-pairs (map #(map vector % column-types) rows)]
    (map #(map transform-value %) value-type-pairs)))

(defn get-column-names
  "Returns a seq of alphanumeric column names of the form
  c1, c2, c3, ... for the given number of columns"
  [num-cols]
  (let [num-range (range 1 (inc num-cols))]
    (->> (map vector (repeat \c) num-range)
         (map string/join))))

(defn get-column-titles
  "Returns a seq of alphanumeric column titles of the form
  Column 1, Column 2, Column 3, ... for the given number of columns"
  [num-cols]
  (let [num-range (range 1 (inc num-cols))]
    (->> (map vector (repeat "Column ") num-range)
         (map string/join))))

(defn get-type-label
  "Returns a keyword label representing the type of the given value.
  Defaults to `:text`."
  [value]
  (condp #(%1 %2) value
    string/blank? :nil
    ;; TODO date-string? :date
    string/numeric? :number
    :text))

(defn all-of-type?
  "Determines if all type labels for the given column are the same or `:nil`"
  [coll type-kw]
  {:pre [(contains? #{:date :number :text} type-kw)]}
  (every? true? (map #(contains? #{:nil type-kw} %) coll)))

(defn get-common-type
  "Determines the common type of the given coll of types.
  Defaults to 'text' if types cannot be unified."
  [coll]
  (condp #(all-of-type? %2 %1) coll
    :date {:client "date" :psql "timestamptz"}
    :number {:client "number" :psql "double precision"}
    :text {:client "text" :psql "text"}
    {:client "text" :psql "text"}))

(defn get-column-types
  "Returns a seq of client & SQL types for each column in the given rows"
  [rows]
  (let [columns (apply map vector rows)]
    (->> (map #(map get-type-label %) columns)
         (map get-common-type))))

(defn get-column-tuples
  "Returns a seq of maps containing column names, titles & types.

  Example output:

  [{:column-name \"c1\" :title \"Column 1\" :type \"text\"} ...]
  "
  [column-names column-titles column-types]
  (map #(zipmap [:column-name :title :type] [%1 %2 %3])
       column-names column-titles column-types))

(defn- load-csv!
  "Imports the given CSV data into a PostgreSQL table"
  [tenant-conn table-name path encoding headers?]
  (try
    (with-open [r (io/reader path :encoding encoding)]
      (let [data (csv/read-csv r)
            headers (when headers? (first data))
            rows (if headers? (rest data) data)
            num-cols (count (first rows))
            column-names (get-column-names num-cols)
            column-titles (or headers (get-column-titles num-cols))
            column-types (get-column-types rows)
            client-types (map :client column-types)
            psql-types (map :psql column-types)
            transformed-rows (transform-rows rows psql-types)]
        (jdbc/db-do-commands tenant-conn
          (jdbc/create-table-ddl table-name
                                 (apply vector [:rnum :serial :primary :key]
                                        (map vector column-names psql-types))))
        (jdbc/insert-multi! tenant-conn table-name column-names transformed-rows)
        {:success? true
         :columns (get-column-tuples column-names column-titles client-types)}))
    (catch Exception e
      {:success? false
       :reason (format "Unexpected error: %s" (.getMessage e))})))

(defn get-encoding
  "Returns the character encoding reading some bytes from the file
  using ICU's CharsetDetector"
  [path]
  (let [detector (CharsetDetector.)
        ;; 100kb
        ba (byte-array 100000)]
       (with-open [is (io/input-stream path)]
         (.read is ba))
       (->  (.setText detector ba)
            (.detect)
            (.getName))))

(defmethod import/valid? "CSV"
  [{:strs [url fileName hasColumnHeaders]}]
  (and (string? url)
       (contains? #{true false nil} hasColumnHeaders)
       (or (nil? fileName)
           (string? fileName))))

(defmethod import/authorized? "CSV"
  [claims config spec]
  true)

(defn- get-path
  [spec file-upload-path]
  (or (get spec "path")
      (let [file-on-disk? (contains? spec "fileName")
            url (get spec "url")]
        (if file-on-disk?
          (str file-upload-path
            "/resumed/"
            (last (string/split url #"\/"))
            "/file")
          url))))

(defmethod import/make-dataset-data-table "CSV"
  [tenant-conn {:keys [file-upload-path]} table-name spec]
  (let [path (get-path spec file-upload-path)
        encoding (get-encoding path)
        headers? (boolean (get spec "hasColumnHeaders"))]
    (load-csv! tenant-conn table-name path encoding headers?)))
