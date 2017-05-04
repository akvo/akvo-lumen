(ns akvo.lumen.import.common
  (:require [cheshire.core :as json])
  (:import org.apache.commons.io.input.UnixLineEndingInputStream))

(defprotocol DatasetImporter
  "
  A protocol for importing datasets into Lumen. A typical implementation
  should also implement java.io.CLoseable because some data sources are
  backed by resources that needs to be released.

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

       :type - The lumen type of the column. Currently :text, :number or :date
       :title - The title of the column
       :id - The internal id of the column (as a keyword). The id must be
             lowercase alphanumeric ([a-z][a-z0-9]*)")
  (records [this]
    "Returns a sequence of record data. A record is a map of column ids to values.
     The type of the value depends on the type of the column where

       :text - java.lang.String
       :number - java.lang.Number
       :date - java.time.Instant"))

(defn dispatch-on-kind [spec]
  (let [kind (get spec "kind")]
    (if (#{"LINK" "DATA_FILE"} kind)
      "CSV" ;; TODO: Unify elsewhere
      kind)))

(defn unix-line-ending-input-stream
  "Thin wrapper around commons-io UnixLineEndingInputStream.
  Accepts and returns an input stream.

  :eof? - true if there should also be a line ending at end of file"
  [input-stream & [{:keys [eof?] :or {eof? false}}]]
  (UnixLineEndingInputStream. input-stream eof?))

(defmulti valid?
  "Validate the data source specification"
  (fn [spec]
    (dispatch-on-kind spec)))

(defmulti authorized?
  "Authorize the data source import request based on the users set of jwt claims"
  (fn [claims config spec]
    (dispatch-on-kind spec)))

(defmulti dataset-importer
  "Creates a DatasetImporter according to the spec"
  (fn [spec config]
    (dispatch-on-kind spec)))

(defmulti make-dataset-data-table
  "Creates a dataset data table with data populated according to the
  data source spec. Returns a status map with keys

  :success? - true if import was successful, false otherwise
  :reason - Short description of the reason for a failed import
  :columns - A sequence of maps with the column specification

                 {:title \"the title\"
                  :column-name \"c1\"
                  :type \"text\"}

             where title is the user visible title of the column,
             column-name is the name of the column in the generated
             table and type is the user visible type of the column
             data (text/number/date)"
  (fn [tenant-conn config table-name spec]
    (dispatch-on-kind spec)))


(defmethod valid? :default [spec]
  false)

(defmethod authorized? :default [claims spec]
  false)

(defmethod make-dataset-data-table :default
  [_ _ _ spec]
  {:success? false
   :reason (str "Invalid data source: " (json/generate-string spec))})
