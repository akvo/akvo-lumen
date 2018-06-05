(ns akvo.lumen.transformation.combine
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.walk :as w]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/combine.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defmethod engine/valid? :core/combine
  [op-spec]
  (let [{[column-name-1 column-name-2] "columnNames"
         column-title "newColumnTitle"
         separator "separator"} (engine/args op-spec)]
    (boolean (and (every? engine/valid-column-name? [column-name-1 column-name-2])
                  (string? column-title)
                  (string? separator)
                  (= (engine/error-strategy op-spec) "fail")))))

(defmethod engine/apply-operation :core/combine
  [tenant-conn table-name columns op-spec]
  (let [new-column-name (engine/next-column-name columns)
        {[first-column-name second-column-name] "columnNames"
         separator "separator"
         column-title "newColumnTitle"} (engine/args op-spec)]
    (add-column tenant-conn {:table-name table-name
                             :column-type "text"
                             :new-column-name new-column-name})
    (combine-columns tenant-conn
                     {:table-name table-name
                      :new-column-name new-column-name
                      :first-column first-column-name
                      :second-column second-column-name
                      :separator separator})
    {:success? true
     :execution-log [(format "Combined columns %s, %s into %s"
                             first-column-name second-column-name new-column-name)]
     :columns (conj columns (w/keywordize-keys {"title" column-title
                                                "type" "text"
                                                "sort" nil
                                                "hidden" false
                                                "direction" nil
                                                "columnName" new-column-name}))}))
