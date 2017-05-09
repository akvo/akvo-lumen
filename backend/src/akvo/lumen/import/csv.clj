(ns akvo.lumen.import.csv
  (:require [akvo.lumen.import.common :as import]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [incanter.core :refer [$ $map ncol to-vect]]
            [incanter.io :refer [read-dataset]]))


(defn- get-column-ids
  "Returns a seq of alphanumeric column names of the form
  c1, c2, c3, ... for the given number of columns"
  [num-cols]
  (let [nums (range 1 (inc num-cols))]
    (->> (map vector (repeat "c") nums)
         (map s/join))))

(defn get-type
  "Returns a keyword representing the type of the given value.
  Defaults to `:text`."
  [value]
  (condp #(%1 %2) value
    ;; TODO date-string? :date
    nil? :nil
    number? :number
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

(defn get-dataset-types
  "Returns a seq of the common types of each column in the given dataset"
  [{:keys [column-names] :as dataset}]
  (->> (map #($map get-type % dataset) column-names)
       (map get-common-type)))

(defn get-column-tuples
  "Returns a vector of maps containing column names, titles & types
  for consumption by the client.

  Example output:

  [{:column-name \"c1\" :title \"Title\" :type \"text\"} ...]
  "
  [column-ids column-names column-types]
  (mapv #(zipmap [:column-name :title :type] [%1 %2 %3])
        column-ids column-names column-types))

(defn- load-csv!
  "Imports the given CSV data into a PostgreSQL table"
  [tenant-conn table-name path headers?]
  (try
    (let [{:keys [column-names] :as dataset} (read-dataset path :header headers?)
          column-ids (get-column-ids (ncol dataset))
          column-titles (if headers? (map name column-names) column-ids)
          column-types (get-dataset-types dataset)
          client-types (mapv :client column-types)
          psql-types (mapv :psql column-types)
          rows (to-vect ($ :all dataset))]
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
        headers? (boolean (get spec "hasColumnHeaders"))]
      (load-csv! tenant-conn table-name path headers?)))
