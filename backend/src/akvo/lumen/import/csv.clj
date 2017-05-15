(ns akvo.lumen.import.csv
  (:require [akvo.lumen.import.common :as import]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [cuerdas.core :as s])
  (:import com.ibm.icu.text.CharsetDetector))


(defn nilify
  "Coerces blank string values to nil"
  [value]
  (if (s/blank? value) nil value))

(defn get-column-names
  "Returns a seq of alphanumeric column names of the form
  c1, c2, c3, ... for the given number of columns"
  [num-cols]
  (let [nums (range 1 (inc num-cols))]
    (->> (map vector (repeat \c) nums)
         (map s/join))))

(defn get-column-titles
  "Returns a seq of titles of the form
  Column 1, Column 2, Column 3, ... for the given number of columns"
  [num-cols]
  (let [nums (range 1 (inc num-cols))]
    (->> (map vector (repeat "Column ") nums)
         (map s/join))))

(defn get-type-kw
  "Returns a keyword representation of the type of the given value.
  Defaults to `:text`."
  [value]
  (condp #(%1 %2) value
    ;; TODO date-string? :date
    nil? :nil
    s/numeric? :number
    :text))

(defn all-of-type?
  "Determines if all types in the given column are the same or `:nil`"
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
  "Returns a seq of types for each column in the given rows"
  [rows]
  (let [columns (apply map vector rows)]
    (->> (map #(map get-type-kw %) columns)
         (map get-common-type))))

(defn get-column-tuples
  "Returns a seq of maps containing column names, titles & types.

  Example output:

  [{:column-name \"c1\" :title \"Column 1\" :type \"text\"} ...]
  "
  [column-ids column-names column-types]
  (map #(zipmap [:column-name :title :type] [%1 %2 %3])
       column-ids column-names column-types))

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
            transformed-rows (map #(transform-row % client-types) rows)]
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
  using ICU's CharsetDetector."
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
            (last (s/split url #"\/"))
            "/file")
          url))))

(defmethod import/make-dataset-data-table "CSV"
  [tenant-conn {:keys [file-upload-path]} table-name spec]
  (let [path (get-path spec file-upload-path)
        encoding (get-encoding path)
        headers? (boolean (get spec "hasColumnHeaders"))]
    (load-csv! tenant-conn table-name path encoding headers?)))
