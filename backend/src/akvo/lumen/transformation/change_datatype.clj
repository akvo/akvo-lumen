(ns akvo.lumen.transformation.change-datatype
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/change_datatype.sql")

(defmethod engine/valid? :core/change-datatype
  [op-spec]
  (let [{:keys [columnName newType parseFormat]} (engine/args op-spec)]
    (boolean (and (engine/valid-type? newType)
                  (engine/valid-column-name? columnName)
                  (if (= newType "date")
                    (string? parseFormat)
                    true)))))

(defn format-sql [table-name column-name type]
  (let [format-str (format "ALTER TABLE %s ALTER COLUMN %s TYPE %s USING "
                           table-name column-name type)]
    (fn [using & args]
      [(apply format (str format-str using) args)])))

(defn- change-datatype [tenant-conn table-name column-name on-error alter-table-sql]
  (jdbc/execute! tenant-conn alter-table-sql)
  (jdbc/execute! tenant-conn "DEALLOCATE ALL")
  (when (= on-error "delete-row")
    (drop-null-rows tenant-conn
                    {:table-name table-name
                     :column-name column-name})))

(defn from-type [columns op-spec]
  (engine/column-type columns (get-in op-spec [:args :columnName])))

(defn type-conversion-sql-function [columns op-spec]
  (let [lumen-type->pg-type (fn [type]
                              (condp = type
                                "text" "text"
                                "number" "double_precision"
                                "date" "timestamptz"
                                (throw (ex-info "Invalid lumen type" {:type type}))))
        from-type (lumen-type->pg-type (from-type columns op-spec))
        to-type (lumen-type->pg-type (get-in op-spec [:args :newType]))]
    (format "%s_to_%s" from-type to-type)))

(defn change-datatype-to-number
  [tenant-conn table-name columns op-spec]
  (let [type-conversion (type-conversion-sql-function columns op-spec)
        on-error (engine/error-strategy op-spec)
        {:keys [columnName defaultValue]} (engine/args op-spec)
        alter-table (format-sql table-name columnName "double precision")
        alter-table-sql (condp = on-error
                          "fail" (alter-table "%s(%s)" type-conversion columnName)
                          "default-value" (alter-table "%s(%s, %s)" type-conversion columnName defaultValue)
                          "delete-row" (alter-table "%s(%s, NULL)" type-conversion columnName))]
    (engine/ensure-number defaultValue)
    (change-datatype tenant-conn table-name columnName on-error alter-table-sql)))

(defn change-datatype-to-text
  [tenant-conn table-name columns op-spec]
  (let [type-conversion (type-conversion-sql-function columns op-spec)
        on-error (engine/error-strategy op-spec)
        {:keys [columnName defaultValue]} (engine/args op-spec)
        default-value (engine/pg-escape-string defaultValue)
        alter-table (format-sql table-name columnName "text")
        alter-table-sql (condp = on-error
                          "fail" (alter-table "%s(%s)" type-conversion columnName)
                          "default-value" (alter-table "%s(%s, '%s')" type-conversion columnName default-value)
                          "delete-row" (alter-table "%s(%s, NULL)" type-conversion columnName))]
    (change-datatype tenant-conn table-name columnName on-error alter-table-sql)))

(defn change-datatype-to-date
  [tenant-conn table-name columns op-spec]
  (let [type-conversion (type-conversion-sql-function columns op-spec)
        on-error (engine/error-strategy op-spec)
        {:keys [columnName
                defaultValue
                parseFormat]} (engine/args op-spec)
        parse-format (engine/pg-escape-string parseFormat)
        alter-table (format-sql table-name columnName "timestamptz")
        alter-table-sql (condp = (from-type columns op-spec)
                          "text" (condp = on-error
                                   "fail" (alter-table "%s(%s, '%s'::text)" type-conversion columnName parseFormat)
                                   "default-value" (alter-table "%s(%s, '%s'::text, to_timestamp(%s))"
                                                                type-conversion columnName parseFormat defaultValue)
                                   "delete-row" (alter-table "%s(%s, '%s'::text, NULL)" type-conversion columnName parseFormat))
                          "number" (condp = on-error
                                     "fail" (alter-table "%s(%s)" type-conversion columnName)
                                     "default-value" (alter-table "%s(%s, to_timestamp(%s))"
                                                                  type-conversion columnName defaultValue)
                                     "delete-row" (alter-table "%s(%s, NULL)" type-conversion columnName))) ]
    (engine/ensure-number defaultValue)
    (change-datatype tenant-conn table-name columnName on-error alter-table-sql)))

(defmethod engine/apply-operation :core/change-datatype
  [tenant-conn table-name columns op-spec]
  (let [{:keys [columnName newType]} (engine/args op-spec)]
    (condp = newType
      "text" (change-datatype-to-text tenant-conn table-name columns op-spec)
      "number" (change-datatype-to-number tenant-conn table-name columns op-spec)
      "date" (change-datatype-to-date tenant-conn table-name columns op-spec))
    {:success? true
     :execution-log [(format "Changed column %s datatype from %s to %s"
                             columnName (engine/column-type columns columnName) newType)]
     :columns (engine/update-column columns columnName assoc "type" newType)}))
