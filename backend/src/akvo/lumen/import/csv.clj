(ns akvo.lumen.import.csv
  (:require [akvo.lumen.import.common :as import]
            [akvo.lumen.util :refer [squuid]]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [hugsql.core :as hugsql])
  (:import com.ibm.icu.text.CharsetDetector
           java.util.UUID
           org.postgresql.PGConnection
           org.postgresql.copy.CopyManager))

(defn- get-cols
  ([num-cols]
   (get-cols num-cols nil))
  ([num-cols c-type]
   (s/join ", "
           (for [i (range 1 (inc num-cols))]
             (str "c" i
                  (if-not (nil? c-type)
                    (str " " c-type)
                    ""))))))


(defn get-create-table-sql
  "Returns a `CREATE TABLE` statement for
  the given number table name and number of columns"
  [t-name num-cols]
  (format "CREATE TABLE %s (%s, %s)"
          t-name
          "rnum serial primary key"
          (get-cols num-cols "text")))

(defn get-copy-sql
  "Returns a `COPY` statement for the given
  table and number of columns"
  [t-name num-cols headers? encoding]
  (format "COPY %s (%s) FROM STDIN WITH (FORMAT CSV, ENCODING '%s'%s)"
          t-name
          (get-cols num-cols)
          encoding
          (if headers? ", HEADER true" "")))

(defn get-headers
  "Returns the first line CSV a file"
  [path separator encoding]
  (with-open [r (io/reader path :encoding encoding)]
    (first (csv/read-csv r :separator separator))))

(defn get-num-cols
  "Returns the number of columns based on the
  first line of a CSV file"
  [path separator encoding]
  (count (get-headers path separator encoding)))

(defn get-encoding
  "Returns the character encoding reading some
  bytes from the file. It uses ICU's CharsetDetector"
  [path]
  (let [detector (CharsetDetector.)
        ;; 100kb
        ba (byte-array 100000)]
    (with-open [is (io/input-stream path)]
      (.read is ba))
    (-> (.setText detector ba)
        (.detect)
        (.getName))))

(defn get-column-tuples
  [col-titles]
  (vec
   (map-indexed (fn [idx title]
                  {:title title
                   :column-name (str "c" (inc idx))
                   :type "text"})
                col-titles)))

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
    (let [ ;; TODO a bit of "manual" integration work
          path (get-path spec file-upload-path)
          headers? (boolean (get spec "hasColumnHeaders"))
          encoding (get-encoding path)
          n-cols (get-num-cols path \, encoding)
          col-titles (if headers?
                       (get-headers path \, encoding)
                       (vec (for [i (range 1 (inc n-cols))]
                              (str "Column " i))))
          copy-sql (get-copy-sql table-name n-cols headers? encoding)]
      (jdbc/execute! tenant-conn [(get-create-table-sql table-name n-cols)])
      (with-open [conn (-> tenant-conn :datasource .getConnection)
                  input-stream (-> (io/input-stream path)
                                   import/unix-line-ending-input-stream)]
        (let [copy-manager (.getCopyAPI (.unwrap conn PGConnection))]
          (.copyIn copy-manager copy-sql input-stream)))
      {:success? true
       :columns (get-column-tuples col-titles)})
    (catch Exception e
      {:success? false
       :reason (str "Unexpected error: " (.getMessage e))})))
