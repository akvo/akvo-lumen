(ns akvo.lumen.transformation.multiple-column
  (:require [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [akvo.lumen.transformation.engine :as engine]
            [cheshire.core :as json]
            [clj-time.coerce :as tc]
            [clojure.walk :refer (keywordize-keys)]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn lumen->pg-type [type]
  (condp = type
    "text"   "text"
    "number" "double precision"
    "date"   "timestamptz"))

  {:args
   {:columns
    [{:extract true, :id 1, :name "Soil Moisture", :type "string"}],
    :extractImage false,
    :selectedColumn
    {:columnName "c108799115",
     :direction nil,
     :hidden false,
     :sort nil,
     :subtype "caddisfly",
     :subtypeId "0b4a0aaa-f556-4c11-a539-c4626582cca6",
     :title "Soil Moisture",
     :type "multiple"}},
   :onError "fail",
   :op "core/extract-multiple"}

(defmethod engine/valid? :core/extract-multiple
  [op-spec]
  (let [{:keys [onError op args]}                      (keywordize-keys op-spec)
        {:keys [columns extractImage selectedColumn] } args
        columns-to-extract                             (filter :extract columns)
        res                                                    (and
                                                                (or extractImage (not-empty columns-to-extract))
                                                                (every? (comp  engine/valid-type? :type) columns-to-extract)
                                                                (#{"fail" "leave-empty" "delete-row"} onError))]
    
    (log/debug ::engine/valid? [ columns-to-extract extractImage selectedColumn onError op res])

    res))

(defn js-execution>sql-params [js-seq result-kw]
  (->> js-seq
       (filter (fn [[j r i]]
                 (= r result-kw)))
       (map (fn [[i _ v]] [i v]))))

(defn set-cells-values! [conn opts data]
  (->> data
       (map (fn [[i v]] (set-cell-value conn (merge {:value v :rnum i} opts))))
       doall))

(defn delete-rows! [conn opts data]
  (->> data
       (map (fn [[i]] (delete-row conn (merge {:rnum i} opts))))
       doall))

(defmethod engine/apply-operation :core/extract-multiple
  [tenant-conn table-name columns op-spec]
  #_(jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [::code
                  ::column-title
                  ::column-type]} (args op-spec)
          new-column-name         (engine/next-column-name columns)
          row-fn                  (js-engine/row-transform-fn {:columns     columns
                                                               :code        code
                                                               :column-type column-type})
          js-execution-seq        (->> (all-data conn {:table-name table-name})
                                       (map (fn [i]
                                              (try
                                                [(:rnum i) :set-value! (row-fn i)]
                                                (catch Exception e
                                                  (condp = (engine/error-strategy op-spec)
                                                    "leave-empty" [(:rnum i) :set-value! nil]
                                                    "delete-row"  [(:rnum i) :delete-row!]
                                                    "fail"        (throw e) ;; interrupt js execution
                                                    ))))))
          base-opts               {:table-name  table-name
                                   :column-name new-column-name}]
      (add-column conn {:table-name      table-name
                        :column-type     (lumen->pg-type column-type)
                        :new-column-name new-column-name})
      (set-cells-values! conn base-opts (js-execution>sql-params js-execution-seq :set-value!))
      (delete-rows! conn base-opts (js-execution>sql-params js-execution-seq :delete-row!))      
      {:success?      true
       :execution-log [(format "Derived columns using '%s'" code)]
       :columns       (conj columns {"title"      column-title
                                     "type"       column-type
                                     "sort"       nil
                                     "hidden"     false
                                     "direction"  nil
                                     "columnName" new-column-name})})))
