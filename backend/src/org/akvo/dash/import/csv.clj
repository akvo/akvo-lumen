(ns org.akvo.dash.import.csv
  (:require [clojure.java.io :as io]
            [clojure.string :as s]
            [clojure.java.jdbc :as jdbc])
  (:import org.postgresql.copy.CopyManager
           org.postgresql.core.BaseConnection
           java.util.UUID))

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

(defn- gen-table-name
  []
  (str "ds_" (s/replace (UUID/randomUUID) #"-" "_")))

(defn get-create-table-sql
  "Returns a `CREATE TABLE` statement for
  the given number table name and number of columns"
  [t-name num-cols c-type temp?]
  (format "CREATE %s %s (%s, %s)"
          (if temp? "TEMP TABLE" "TABLE")
          t-name
          (if temp? "serial rnum" "integer rnum")
          (get-cols num-cols c-type)))

(defn get-copy-sql
  "Returns a `COPY` statement for the given
  table and number of columns"
  [t-name num-cols headers?]
  (format "COPY %s (%s) FROM STDIN WITH (FORMAT CSV%s)"
          t-name
          (get-cols num-cols)
          (if headers? ", HEADER true" "")))

(defn get-insert-sql
  "Returns an `INSERT` statement for a given
  table and number of columns."
  [src-table dest-table num-cols]
  (let [cols (for [i (range 1 (inc num-cols))]
               (str "c" i))
        src-cols (map #(format "to_jsonb(replace(%s, '\\', '\\\\'))" %) cols)]
    (format "INSERT INTO %s (rnum, %s) SELECT rnum, %s FROM %s"
            dest-table
            (s/join ", " cols)
            (s/join ", " src-cols)
            src-table)))

(defn get-num-cols
  "Returns the number of columns from a file"
  [path separator]
  (with-open [r (io/reader path)]
    (let [line (.readLine r)]
      (count (s/split line (re-pattern (str separator)))))))

(defn make-dataset
  "Creates a dataset from a CSV file on disk"
  [spec conn]
  (let [fpath (:path spec)
        n-cols (get-num-cols fpath)
        id (gen-table-name)
        id-temp (str id "_temp")]
    []))
