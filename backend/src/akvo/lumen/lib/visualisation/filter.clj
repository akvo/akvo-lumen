(ns akvo.lumen.lib.visualisation.filter
  (:require [clojure.string :as str])
  (:import [java.sql.Timestamp]))

(defmulti filter-sql (fn [filter]
                       (get filter "strategy")))

(defn parse-number [s]
  (try
    (Double/parseDouble s)
    (catch NumberFormatException e
      (throw (ex-info "Not a number" {:string s})))))

(defn parse-date [s]
  (try
    (java.sql.Timestamp. (Long/parseLong s))
    (catch NumberFormatException e
      (throw (ex-info "Not a timestamp" {:string s})))))

(defn escape-sql-str [s]
  (str/replace s "'" "''"))

(defmethod filter-sql "isHigher"
  [{:strs [column operation value]}]
  (let [op (if (= operation "keep") ">" "<=")]
    (condp = (get column "type")
      "number" (format "%s %s %s"
                       (get column "columnName")
                       op
                       (parse-number value))
      "date" (format "%s %s '%s'::timestamptz"
                     (get column "columnName")
                     op
                     (parse-date value))
      (throw (ex-info "Invalid type" {:type (get column "type")})))))

(defmethod filter-sql "is"
  [{:strs [column operation value]}]
  (let [op (if (= operation "keep") "=" "<>")]
    (condp = (get column "type")
      "number" (format "%s %s %s"
                       (get column "columnName")
                       op
                       (parse-number value))
      "date" (format "%s %s '%s'::timestamptz"
                     (get column "columnName")
                     op
                     (parse-date value))
      "text" (format "%s %s '%s'"
                     (get column "columnName")
                     op
                     (escape-sql-str value))
      (throw (ex-info "Invalid type" {:type (get column "type")})))))

(defmethod filter-sql "isEmpty"
  [{:strs [column operation]}]
  (if (= (get column "type") "text")
    (format "coalesce(%s, '') %s ''"
            (get column "columnName")
            (if (= operation "keep") "<>" "="))
    (format "%s IS %s"
            (get column "columnName")
            (if (= operation "keep")
              "NULL"
              "NOT NULL"))))

(defmethod filter-sql :default [filter]
  (throw (ex-info "Invalid filter" {:filter filter}))
  (prn filter))

(defn find-column [columns column-name]
  (first (filter #(= (get % "columnName") column-name) columns)))

(defn sql-str [columns filters]
  (if (empty? filters)
    "TRUE"
    (let [filters (map #(assoc % "column" (find-column columns (get % "column")))
                       filters)]
      (str/join " AND " (map filter-sql filters)))))

(comment
  (def columns [{"columnName" "c1"
                 "type" "text"}
                {"columnName" "c2"
                 "type" "number"}
                {"columnName" "c3"
                 "type" "date"}])

  (def filters
    [{"column" "c1"
      "columnType" "text"
      "value" nil
      "operation" "remove"
      "strategy" "isEmpty"}
     {"column" "c1"
      "columnType" "text"
      "value" "Male"
      "operation" "keep"
      "strategy" "is"}
     {"column" "c2"
      "columnType" "number"
      "value" "5"
      "operation" "remove"
      "strategy" "is"}
     {"column" "c2"
      "columnType" "number"
      "value" "10"
      "operation" "remove"
      "strategy" "isHigher"}])

  (sql-str columns filters)
  (sql-str columns [])
  )
