(ns org.akvo.dash.import.csv
  (:require [clojure.java.io :as io]
            [clojure.string :as s]
            [clojure.java.jdbc :as jdbc]
            [clojure.data.csv :as csv]
            [hugsql.core :as hugsql]
            [org.akvo.dash.endpoint.util :refer [squuid]])
  (:import org.postgresql.copy.CopyManager
           org.postgresql.core.BaseConnection
           java.util.UUID))

(hugsql/def-db-fns "org/akvo/dash/import.sql")

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
          (if temp? "rnum serial" "rnum integer")
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

(defn get-headers
  "Returns the first line CSV a file"
  [path separator]
  (with-open [r (io/reader path)]
    (first (csv/read-csv r :separator separator))))

(defn get-num-cols
  "Returns the number of columns based on the
  first lie of a CSV file"
  [path separator]
  (count (get-headers path separator)))

(defn get-column-tuples
  "Returns a vector of tuples suitable for a single
   SQL insert"
  [dataset-id, names, num-cols, c-type]
  (vec
   (for [i (range 1 (inc num-cols))]
     [(str (squuid))
      dataset-id
      c-type
      (if (empty? names) (str "Column " i) (nth names (dec i)))
      (str "c" i)
      (* 10 i)])))

(defn make-dataset
  "Creates a dataset from a CSV file"
  [conn spec]
  (let [path (:path spec)
        headers? (:headers? spec)
        dataset-name (:dataset-name spec)
        col-names (if headers? (get-headers path \,) [])
        n-cols (get-num-cols path \,)
        table (gen-table-name)
        temp (str table "_temp")
        dataset-id (str (squuid))
        copy-manager (CopyManager. (cast BaseConnection (:connection conn)))
        _ (jdbc/execute! conn [(get-create-table-sql temp n-cols "text" true)])
        _ (jdbc/execute! conn [(get-create-table-sql table n-cols "jsonb" false)])
        _ (.copyIn copy-manager (get-copy-sql temp n-cols headers?) (io/input-stream path))
        _ (jdbc/execute! conn [(get-insert-sql temp table n-cols)])
        _ (insert-dataset conn {:id dataset-id
                                :name dataset-name})
        _ (insert-dataset-version conn {:id (str (squuid))
                                        :dataset-id dataset-id
                                        :table-name table})
        _ (insert-dataset-columns conn {:columns
                                        (get-column-tuples dataset-id col-names n-cols "text")})]
    dataset-id))
