(ns akvo.lumen.lib.transformation.derive-category
  (:require [akvo.lumen.util :as util]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.dataset.utils :as dataset.utils]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.set :as set]
            [clojure.set :refer (rename-keys) :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [hugsql.core :as hugsql]
            [clojure.spec.alpha :as s]
            [akvo.lumen.specs.transformation :as transformation.s]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/derive.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation/engine.sql")

(defmethod engine/valid? "core/derive-category"
  [op-spec]
  (let [op-spec (walk/keywordize-keys op-spec)]
    (and (s/valid? ::transformation.s/op-spec op-spec)
         (let [mappings (get-in op-spec [:args :derivation :mappings])
               cats (map last mappings)]
           (= (count (distinct cats)) (count cats))))))

(defn mappings-dict [mappings]
  (reduce (fn [c [source-vals mapped-val]]
            (reduce #(assoc % %2 mapped-val) c source-vals)) {} mappings))

(defn find-text-cat [mappings v uncategorized-value]
  (get mappings v uncategorized-value))

(defn find-number-cat [mappings v uncategorized-value]
  (if-not v
    uncategorized-value
    (or
     (some (fn [[[a b :as x] [c d :as y] cat]]
             (let [exp (read-string (format "(%s %s %s)" a v b))
                   eval1 (eval exp)]
               (if y
                 (let [exp2 (read-string (format "(%s %s %s)" c v d))
                       eval1&2 (and eval1 (eval exp2))]
                   (when eval1&2 cat))
                 (when eval1 cat))))
           mappings)
     uncategorized-value)))


(defmethod engine/apply-operation "core/derive-category"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [op-spec               (walk/keywordize-keys op-spec)
        source-column-name    (get-in op-spec [:args :source :column :columnName])
        column-title          (get-in op-spec [:args :target :column :title])
        uncategorized-value   (get-in op-spec [:args :derivation :uncategorizedValue] "Uncategorised")
        new-column-name       (engine/next-column-name columns)
        all-data              (all-data tenant-conn {:table-name table-name})
        mappings              (get-in op-spec [:args :derivation :mappings])
        derivation-type       (get-in op-spec [:args :derivation :type] "text")
        execution-log-message (format "Derived category '%s' using column: '%s'(%s) and mappings: '%s'"
                                      column-title
                                      (:title (dataset.utils/find-column (walk/keywordize-keys columns) source-column-name))
                                      derivation-type
                                      mappings)]
    (jdbc/with-db-transaction [tenant-conn tenant-conn]
      (add-column tenant-conn {:table-name      table-name
                               :column-type     "text"
                               :new-column-name new-column-name})
      (doseq [i all-data]
        (let [v (get i (keyword source-column-name))]
          (set-cell-value tenant-conn
                          {:rnum        (:rnum i)
                           :value       (condp = derivation-type
                                          "text"   (find-text-cat (mappings-dict mappings) v uncategorized-value)
                                          "number" (find-number-cat mappings v uncategorized-value))
                           :column-name new-column-name
                           :table-name  table-name})))
      {:success?      true
       :execution-log [execution-log-message]
       :columns       (conj columns {"title"      column-title
                                     "type"       "text"
                                     "sort"       nil
                                     "hidden"     false
                                     "direction"  nil
                                     "columnName" new-column-name})})))
