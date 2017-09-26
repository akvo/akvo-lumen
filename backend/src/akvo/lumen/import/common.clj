(ns akvo.lumen.import.common)

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
       :type - The lumen type of the column. Currently :text, :number or :date
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
       :date - java.time.Instant"))

(defn dispatch-on-kind [spec]
  (let [kind (get spec "kind")]
    (if (#{"LINK" "DATA_FILE"} kind)
      "CSV" ;; TODO: Unify elsewhere
      kind)))

(defmulti dataset-importer
  "Creates a DatasetImporter according to the spec"
  (fn [spec config]
    (dispatch-on-kind spec)))
