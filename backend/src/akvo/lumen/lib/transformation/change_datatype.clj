(ns akvo.lumen.lib.transformation.change-datatype
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/change_datatype.sql")

(defmethod engine/valid? "core/change-datatype"
  [op-spec]
  (let [{column-name "columnName"
         new-type "newType"
         parse-format "parseFormat"} (engine/args op-spec)]
    (boolean (and (util/valid-type? new-type)
                  (util/valid-column-name? column-name)
                  (if (= new-type "date")
                    (string? parse-format)
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
  (engine/column-type columns (get-in op-spec ["args" "columnName"])))

(defn type-conversion-sql-function [columns op-spec]
  (let [lumen-type->pg-type (fn [type]
                              (condp = type
                                "text" "text"
                                "number" "double_precision"
                                "date" "timestamptz"
                                (throw (ex-info "Invalid lumen type" {:type type}))))
        from-type (lumen-type->pg-type (from-type columns op-spec))
        to-type (lumen-type->pg-type (get-in op-spec ["args" "newType"]))]
    (format "%s_to_%s" from-type to-type)))

(defn change-datatype-to-number
  [tenant-conn table-name columns op-spec]
  (let [type-conversion (type-conversion-sql-function columns op-spec)
        on-error (engine/error-strategy op-spec)
        {column-name "columnName"
         default-value "defaultValue"} (engine/args op-spec)
        alter-table (format-sql table-name column-name "double precision")
        alter-table-sql (condp = on-error
                          "fail" (alter-table "%s(%s)" type-conversion column-name)
                          "default-value" (alter-table "%s(%s, %s)" type-conversion column-name default-value)
                          "delete-row" (alter-table "%s(%s, NULL)" type-conversion column-name))]
    (engine/ensure-number default-value)
    (change-datatype tenant-conn table-name column-name on-error alter-table-sql)))

(defn change-datatype-to-text
  [tenant-conn table-name columns op-spec]
  (let [type-conversion (type-conversion-sql-function columns op-spec)
        on-error (engine/error-strategy op-spec)
        {column-name "columnName"
         default-value "defaultValue"} (engine/args op-spec)
        default-value (postgres/escape-string default-value)
        alter-table (format-sql table-name column-name "text")
        alter-table-sql (condp = on-error
                          "fail" (alter-table "%s(%s)" type-conversion column-name)
                          "default-value" (alter-table "%s(%s, '%s')" type-conversion column-name default-value)
                          "delete-row" (alter-table "%s(%s, NULL)" type-conversion column-name))]
    (change-datatype tenant-conn table-name column-name on-error alter-table-sql)))

(defn change-datatype-to-date
  [tenant-conn table-name columns op-spec]
  (let [type-conversion (type-conversion-sql-function columns op-spec)
        on-error (engine/error-strategy op-spec)
        {column-name "columnName"
         default-value "defaultValue"
         parse-format "parseFormat"} (engine/args op-spec)
        parse-format (postgres/escape-string parse-format)
        alter-table (format-sql table-name column-name "timestamptz")
        alter-table-sql (condp = (from-type columns op-spec)
                          "text" (condp = on-error
                                   "fail" (alter-table "%s(%s, '%s'::text)" type-conversion column-name parse-format)
                                   "default-value" (alter-table "%s(%s, '%s'::text, to_timestamp(%s))"
                                                                type-conversion column-name parse-format default-value)
                                   "delete-row" (alter-table "%s(%s, '%s'::text, NULL)" type-conversion column-name parse-format))
                          "number" (condp = on-error
                                     "fail" (alter-table "%s(%s)" type-conversion column-name)
                                     "default-value" (alter-table "%s(%s, to_timestamp(%s))"
                                                                  type-conversion column-name default-value)
                                     "delete-row" (alter-table "%s(%s, NULL)" type-conversion column-name))) ]
    (engine/ensure-number default-value)
    (change-datatype tenant-conn table-name column-name on-error alter-table-sql)))

(defmethod engine/apply-operation "core/change-datatype"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [{column-name "columnName"
         new-type "newType"} (engine/args op-spec)]
    (condp = new-type
      "text" (change-datatype-to-text tenant-conn table-name columns op-spec)
      "number" (change-datatype-to-number tenant-conn table-name columns op-spec)
      "date" (change-datatype-to-date tenant-conn table-name columns op-spec))
    {:success? true
     :execution-log [(format "Changed column %s datatype from %s to %s"
                             column-name (engine/column-type columns column-name) new-type)]
     :columns (engine/update-column columns column-name assoc "type" new-type)}))
