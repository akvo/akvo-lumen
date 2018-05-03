(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [clj-time.coerce :as tc]
            [akvo.lumen.transformation.engine :as engine]
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

(defn args [op-spec]
  (let [{code         "code"
         column-title "newColumnTitle"
         column-type  "newColumnType"} (engine/args op-spec)]
    {::code code ::column-title column-title ::column-type column-type}))

(defmethod engine/valid? :core/derive
  [op-spec]
  (let [{:keys [::code ::column-title ::column-type]} (args op-spec)
        res (and (string? column-title) ;; TODO: ... should that be checked at other level .... endpoint???
         (engine/valid-type? column-type) ;; same applies here ...
         (#{"fail" "leave-empty" "delete-row"} (engine/error-strategy op-spec)) ;; too
         (js-engine/evaluable? code))]
    (log/debug :VALID? code res)
    res
    ))

(defn js-execution>sql-params [js-seq result-kw]
  (->> js-seq
       (filter (fn [[j r i]]
                     (= r result-kw)))
       (map (fn [[i _ v]] [i v]))))

(def max-items-to-process 8000)

(defn set-cells-values! [conn opts data]
  (->> data
       (map (fn [[i v]] (set-cell-value conn (merge {:value v :rnum i} opts))))
       doall))

(defn delete-rows! [conn opts data]
  (->> data
       (map (fn [[i]] (delete-row conn (merge {:rnum i} opts))))
       doall))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [::code
                  ::column-title
                  ::column-type]} (args op-spec)
          new-column-name         (engine/next-column-name columns)
          row-fn                  (js-engine/row-transform-fn {:columns     columns
                                                               :code        code
                                                               :column-type column-type})
          ;; TODO: think how to execute-js depending of error-strategy
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
      (log/error :CODE code (map str js-execution-seq))
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
