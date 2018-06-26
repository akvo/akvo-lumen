(ns akvo.lumen.lib.aggregation.filter
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.string :as str])
  (:import [java.sql.Timestamp]))

(defn invalid-filter [msg map]
  (throw (ex-info (format "Invalid filter: %s" msg) map)))

(defmulti filter-sql (fn [filter]
                       (:strategy filter)))

(defn- char-range [start end]
  (map char (range (int start) (inc (int end)))))

(def alphanumerics (concat (char-range \a \z)
                           (char-range \A \Z)
                           (take 10 (range))))

(defn random-tag []
  (format "tag_%s" (->> #(rand-nth alphanumerics)
                        repeatedly
                        (take 10)
                        (apply str))))

(defn parse-number [s]
  (try
    (Double/parseDouble s)
    (catch NumberFormatException e
      (invalid-filter "Not a number" {:string s}))))

(defn parse-date [s]
  (try
    (java.sql.Timestamp. (* s 1000))
    (catch NumberFormatException e
      (invalid-filter "Not a timestamp" {:string s}))))

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
  [{:keys [column operation value]}]
  (let [{:keys [type columnName]} column
        op (if (= operation "keep") ">" "<=")]
    (comparison op type columnName value)))

(defmethod filter-sql "isLower"
  [{:keys [column operation value]}]
  (let [{:keys [type columnName]} column
        op (if (= operation "keep") "<" ">=")]
    (comparison op type columnName value)))

(defmethod filter-sql "is"
  [{:keys [column operation value]}]
  (let [{:keys [type columnName]} column
        op (if (= operation "keep") "=" "<>")]
    (condp = type
      "number" (format "%1$s IS NULL OR %1$s %2$s %3$s"
                       columnName
                       op
                       (parse-number value))
      "date" (format "%1$s IS NULL OR %1$s %2$s '%3$s'::timestamptz"
                     columnName
                     op
                     (parse-date value))
      "text" (format "coalesce(%1$s, '') %2$s '%3$s'"
                     columnName
                     op
                     (engine/pg-escape-string value))
      (invalid-filter "Type not supported" {:type type}))))

(defmethod filter-sql "isEmpty"
  [{:keys [column operation]}]
  (let [{:keys [type columnName]} column]
    (if (= type "text")
      (format "coalesce(%s, '') %s ''"
              columnName
              (if (= operation "keep") "=" "<>"))
      (format "%s IS %s"
              columnName
              (if (= operation "keep")
                "NULL"
                "NOT NULL")))))

(defmethod filter-sql :default [filter]
  (invalid-filter "No such filter strategy" {:strategy (:strategy filter)}))

(defn find-column [columns column-name]
  (if-let [column (first (filter #(= (:columnName %) column-name) columns))]
    column
    (invalid-filter "No such column" {:column column-name})))

(defn sql-str [columns filters]
  (if (empty? filters)
    "TRUE"
    (let [filters (map #(assoc % :column (find-column columns (:column %)))
                       filters)]
      (str/join " AND " (map #(format "(%s)" (filter-sql %))
                             filters)))))
