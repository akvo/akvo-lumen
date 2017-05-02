(ns akvo.lumen.import.csv
  (:require [akvo.lumen.import.common :as import]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [incanter.core :as incanter]
            [incanter.io :refer [read-dataset]])
  (:import [com.ibm.icu.text CharsetDetector]))


(defn- get-column-ids
  "Returns a seq of generic, alphanumeric column names
  of the form c1, c2, c3, ... for the given number of columns"
  [num-cols]
  (map #(str "c" %) (range 1 (inc num-cols))))

(defn get-type
  "Determines the client and PostgreSQL type of the given value.
  Defaults to 'text'."
  [value]
  (condp #(%1 %2) value
    ;; date-string? :date
    nil? :nil
    number? :number
    :text))

(defn all-of-type?
  "Determines if all types in the given column are unified"
  [type-kw coll]
  {:pre [(contains? #{:date :number :text} type-kw)]}
  (every? true? (map #(contains? #{:nil type-kw} %) coll)))

(defn get-common-type
  "Determines the common type of the given coll of types.
  Defaults to 'text' if types cannot be unified."
  [coll]
  (condp #(all-of-type? %1 %2) coll
    :date {:client "date" :psql "timestamptz"}
    :number {:client "number" :psql "double precision"}
    :text {:client "text" :psql "text"}
    {:client "text" :psql "text"}))

(defn get-column-types
  "Returns a seq of the common types of each column in the given dataset"
  [{:keys [column-names] :as dataset}]
  (->> (map #(incanter/$map get-type % dataset) column-names)
       (map get-common-type)))

(defn get-column-tuples
  "Returns a sequence of maps containing column names, titles & types
  for consumption by the client.

  Example output:

  [{:column-name \"c1\" :title \"Title\" :type \"text\"} ...]
  "
  [column-ids column-names column-types]
  (mapv #(into {} {:column-name %1 :title %2 :type %3})
        column-ids column-names column-types))

(defn get-encoding
  "Returns the character encoding reading some bytes from the given CSV file
  using ICU's `CharsetDetector`"
  [path]
  (let [detector (CharsetDetector.)
        ;; 100kb
        ba (byte-array 100000)]
    (with-open [input-stream (io/input-stream path)]
      (.read input-stream ba))
    (-> (.setText detector ba)
        (.detect)
        (.getName))))

(defn- load-csv!
  "Imports the given CSV data into a PostgreSQL table"
  [tenant-conn table-name path encoding headers?]
  (try
    (let [{:keys [column-names] :as dataset} (read-dataset path :header headers?)
          column-ids (get-column-ids (incanter/ncol dataset))
          column-titles (if headers? (map name column-names) column-ids)
          column-types (get-column-types dataset)
          client-types (mapv :client column-types)
          psql-types (mapv :psql column-types)
          rows (incanter/to-vect (incanter/$ :all dataset))]
      (jdbc/db-do-commands tenant-conn
        (jdbc/create-table-ddl
          table-name
          (apply vector [:rnum :serial :primary :key]
                        (map vector column-ids psql-types))))
      (jdbc/insert-multi! tenant-conn table-name column-ids rows)
      {:success? true
       :columns (get-column-tuples column-ids column-titles client-types)})
    (catch Exception e
      {:success? false
       :reason (format "Unexpected error: %s" (.getMessage e))})))

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
        headers? (boolean (get spec "hasColumnHeaders"))
        encoding (get-encoding path)]
      (load-csv! tenant-conn table-name path encoding headers?)))
