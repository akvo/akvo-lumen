(ns akvo.lumen.import.csv
  (:require [akvo.lumen.import.common :as import]
            [akvo.lumen.util :refer [squuid]]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as s])
  (:import com.ibm.icu.text.CharsetDetector))


(defn- get-cols
  "Returns a vector of column names and PostgreSQL data types"
  [num-cols & [col-type]]
  (let [col-type-str (if col-type (str " " col-type) "")]
    (vec (map #(str "c" % col-type-str)
              (range 1 (inc num-cols))))))

(defn- create-table! ;; TODO handle column types other than "text"
  "Creates a table of the given name & number of columns"
  [tenant-conn table-name num-cols]
  (let [sql (format "CREATE TABLE %s (rnum serial primary key, %s)"
                    table-name
                    (s/join ", " (get-cols num-cols "text")))]
    (jdbc/execute! tenant-conn [sql])))

(defn get-headers
  "Returns the first line of the given CSV file"
  [path separator encoding]
  (with-open [reader (io/reader path :encoding encoding)]
    (first (csv/read-csv reader :separator separator))))

(defn get-num-cols
  "Returns the number of columns based on the
  first line of a CSV file"
  [path separator encoding]
  (count (get-headers path separator encoding)))

(defn get-encoding
  "Returns the character encoding reading some
  bytes from the given CSV file. Uses ICU's `CharsetDetector`"
  [path]
  (let [detector (CharsetDetector.)
        ;; 100kb
        ba (byte-array 100000)]
    (with-open [input-stream (io/input-stream path)]
      (.read input-stream ba))
    (-> (.setText detector ba)
        (.detect)
        (.getName))))

(defn get-column-tuples ;; TODO handle types other than "text"
  [col-titles]
  (vec
    (map-indexed (fn [idx title]
                   {:title title
                    :column-name (str "c" (inc idx))
                    :type "text"})
                 col-titles)))

(defn insert-from-csv!
  "Inserts data from the given CSV file into the given table name"
  [tenant-conn table-name num-cols headers? path separator encoding]
  (with-open [reader (io/reader path :encoding encoding)]
    (let [headers (get-cols (get-num-cols path \, encoding))
          data (csv/read-csv reader :separator separator)
          rows (if headers? (rest data) data)]
      (jdbc/insert-multi! tenant-conn (keyword table-name) headers rows))))

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
  (try
    (let [path (get-path spec file-upload-path)
          separator \,
          headers? (boolean (get spec "hasColumnHeaders"))
          encoding (get-encoding path)
          num-cols (get-num-cols path separator encoding)]
      (create-table! tenant-conn table-name num-cols)
      (insert-from-csv! tenant-conn table-name num-cols headers? path separator encoding)
      (let [col-titles (if headers?
                         (get-headers path separator encoding)
                         (vec (map #(str "Column " %)
                                   (range 1 (inc num-cols)))))]
        {:success? true
         :columns (get-column-tuples col-titles)}))
    (catch Exception e
      {:success? false
       :reason (str "Unexpected error: " (.getMessage e))})))
