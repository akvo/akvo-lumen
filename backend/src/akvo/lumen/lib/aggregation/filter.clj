(ns akvo.lumen.lib.aggregation.filter
  (:require [clojure.string :as str])
  (:import [java.sql.Timestamp]))

(defn invalid-filter [msg map]
  (throw (ex-info (format "Invalid filter: %s" msg) map)))

(defmulti filter-sql (fn [filter]
                       (get filter "strategy")))

(defn parse-number [s]
  (try
    (Double/parseDouble s)
    (catch NumberFormatException e
      (invalid-filter "Not a number" {:string s}))))

(defn parse-date [s]
  (try
    (java.sql.Timestamp. (Long/parseLong s))
    (catch NumberFormatException e
      (invalid-filter "Not a timestamp" {:string s}))))

(defn escape-sql-str [s]
  (str/replace s "'" "''"))

(defn comparison [op column-type column-name value]
  (condp = column-type
    "number" (format "%s %s %s"
                     column-name
                     op
                     (parse-number value))
    "date" (format "%s %s '%s'::timestamptz"
                   column-name
                   op
                   (parse-date value))
    (invalid-filter "isHigher/isLower not supported on this column type" {:type column-type})))

(defmethod filter-sql "isHigher"
  [{:strs [column operation value]}]
  (let [{column-type "type" column-name "columnName"} column
        op (if (= operation "keep") ">" "<=")]
    (comparison op column-type column-name value)))

(defmethod filter-sql "isLower"
  [{:strs [column operation value]}]
  (let [{column-type "type" column-name "columnName"} column
        op (if (= operation "keep") "<" ">=")]
    (comparison op column-type column-name value)))

(defmethod filter-sql "is"
  [{:strs [column operation value]}]
  (let [{column-type "type" column-name "columnName"} column
        op (if (= operation "keep") "=" "<>")]
    (condp = column-type
      "number" (format "%1$s IS NULL OR %1$s %2$s %3$s"
                       column-name
                       op
                       (parse-number value))
      "date" (format "%1$s IS NULL OR %1$s %2$s '%3$s'::timestamptz"
                     column-name
                     op
                     (parse-date value))
      "text" (format "coalesce(%1$s, '') %2$s '%3$s'"
                     column-name
                     op
                     (escape-sql-str value))
      (invalid-filter "Type not supported" {:type column-type}))))

(defmethod filter-sql "isEmpty"
  [{:strs [column operation]}]
  (let [{column-type "type" column-name "columnName"} column]
    (if (= column-type "text")
      (format "coalesce(%s, '') %s ''"
              column-name
              (if (= operation "keep") "=" "<>"))
      (format "%s IS %s"
              column-name
              (if (= operation "keep")
                "NULL"
                "NOT NULL")))))

(defmethod filter-sql :default [filter]
  (invalid-filter "No such filter strategy" {:strategy (get filter "strategy")}))

(defn find-column [columns column-name]
  (if-let [column (first (filter #(= (get % "columnName") column-name) columns))]
    column
    (invalid-filter "No such column" {:column column-name})))

(defn sql-str [columns filters]
  (if (empty? filters)
    "TRUE"
    (let [filters (map #(assoc % "column" (find-column columns (get % "column")))
                       filters)]
      (str/join " AND " (map filter-sql filters)))))
