(ns akvo.lumen.lib.transformation.combine
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation.combine :as db.tx.combine]
            [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [akvo.lumen.util :as util]
            [clojure.tools.logging :as log]))

(defmethod engine/valid? "core/combine"
  [op-spec]
  (let [{[column-name-1 column-name-2] "columnNames"
         column-title "newColumnTitle"
         separator "separator"} (engine/args op-spec)]
    (boolean (and (every? util/valid-column-name? [column-name-1 column-name-2])
                  (string? column-title)
                  (string? separator)
                  (= (engine/error-strategy op-spec) "fail")))))

(defmethod engine/apply-operation "core/combine"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [new-column-name (engine/next-column-name columns)
        {[first-column-name second-column-name] "columnNames"
         separator "separator"
         column-title "newColumnTitle"} (engine/args op-spec)]
    (db.tx.engine/add-column tenant-conn {:table-name table-name
                             :column-type "text"
                             :new-column-name new-column-name})
    (db.tx.combine/combine-columns tenant-conn
                     {:table-name table-name
                      :new-column-name new-column-name
                      :first-column first-column-name
                      :second-column second-column-name
                      :separator separator})
    {:success? true
     :execution-log [(format "Combined columns %s, %s into %s"
                             first-column-name second-column-name new-column-name)]
     :columns (conj columns {"title" column-title
                             "type" "text"
                             "sort" nil
                             "hidden" false
                             "direction" nil
                             "columnName" new-column-name})}))

(defmethod engine/columns-used "core/combine"
  [applied-transformation columns]
  [(:columnNames (:args applied-transformation))])
