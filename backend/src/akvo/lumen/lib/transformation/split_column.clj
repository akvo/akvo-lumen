(ns akvo.lumen.lib.transformation.split-column
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.util :as util]
            [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [akvo.lumen.db.transformation :as db.transformation]
            [clojure.java.jdbc :as jdbc]
            [akvo.lumen.postgres :as postgres]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [clojure.walk :as walk])
  (:import [java.util.regex Pattern]))

(defn pattern-analysis [re-pattern* column-values]
  (reduce
   (fn [store value]
     (let [freqs (frequencies (re-seq re-pattern* value))]
       (-> (reduce (fn [c [k v]]
                     (let [path [:analysis k]]
                       (-> c
                           (assoc-in path
                                     {:max-coincidences-in-one-row (max v (get-in c (conj path :max-coincidences-in-one-row) 0))
                                      :total-row-coincidences      (inc (get-in c (conj path :total-row-coincidences) 0))
                                      :total-column-coincidences   (+ v (get-in c (conj path :total-column-coincidences) 0))}))))
                   store freqs)
           (update :rows inc))))
   {:rows 0}
   column-values))

(defn selected-column [args]
  (-> args :selectedColumn))

(defn col-name [args]
  (-> (selected-column args) :columnName))

(defn pattern* [args]
  (-> args :pattern))

(defn new-column-name [args]
  (-> args :newColumnName))

(defmethod engine/valid? "core/split-column"
  [op-spec]
  (let [{:keys [onError op args] :as op-spec} (walk/keywordize-keys op-spec)]
    (and (util/valid-column-name? (col-name args))
         (pattern* args)
         (new-column-name args))))

(defn- add-name-to-new-columns
  [columns new-columns]
  (let [next-column-index (engine/next-column-index columns)
        indexes (map engine/derivation-column-name (iterate inc next-column-index))]
    (map #(assoc % :columnName %2 :id %2) new-columns indexes)))

(defn columns-to-extract [prefix number-new-rows selected-column columns]
  (let [selected-column (find-column (walk/keywordize-keys columns) (:columnName selected-column))
        base-column (dissoc selected-column :type :columnName :groupId :groupName)
        new-columns (map #(assoc base-column :title (str prefix "-" %) :type "text")
                         (range 1 (inc number-new-rows)))]
    (add-name-to-new-columns columns new-columns)))

(defn- update-row [conn table-name row-id vals-map]
  (let [r (string/join "," (doall (map (fn [[k v]]
                                         (str k "=" (postgres/adapt-string-value v))) vals-map)))
        sql (str  "update " table-name " SET "  r " where rnum=" row-id)]
    (log/debug :sql sql)
    (jdbc/execute! conn sql)))

(defn split [cell-value re-pattern* new-rows-count]
  (let [default-values (take new-rows-count (repeat ""))]
    (if cell-value
      (as-> (string/split cell-value re-pattern*) values
        (cond
          (nil? values)         default-values
          (empty? values)       default-values
          (== 1 (count values)) default-values
          :else                 (apply conj default-values (reverse values))))
      default-values)))

(defmethod engine/apply-operation "core/split-column"
  [{:keys [tenant-conn]} dataset-versions op-spec]
  (jdbc/with-db-transaction [tenant-conn tenant-conn]
    (let [{:keys [onError op args]} (walk/keywordize-keys op-spec)
          table-name (engine/get-table-name dataset-versions op-spec)
          namespace (engine/get-namespace op-spec)
          columns (:columns (engine/get-dsv dataset-versions namespace))
          column-name               (col-name args)         
          pattern                   (pattern* args)
          re-pattern*               (re-pattern (Pattern/quote pattern))]
      (if-let [pattern-analysis (get
                                 (->> (db.transformation/select-column-data tenant-conn {:table-name table-name :column-name column-name})
                                      (map (comp str (keyword column-name)))
                                      (pattern-analysis re-pattern*)
                                      :analysis)
                                 pattern)]
        (let [new-rows-count    (inc (:max-coincidences-in-one-row pattern-analysis))
              new-columns       (columns-to-extract (new-column-name args) new-rows-count (selected-column args) columns)
              add-db-columns    (doseq [c new-columns]
                                  (db.tx.engine/add-column tenant-conn {:table-name      table-name
                                                           :column-type     (:type c)
                                                           :new-column-name (:id c)}))
              update-db-columns (doseq [row (db.transformation/select-rnum-and-column tenant-conn {:table-name table-name
                                                                                 :column-name column-name})]
                                  (->>
                                   (split ((keyword column-name) row) re-pattern* new-rows-count)
                                   (map (fn [column v]
                                          [(:id column) v]) new-columns)
                                   (update-row tenant-conn table-name (:rnum row))))]
          {:success?      true
           :execution-log [(format "Splitted column %s with pattern %s" column-name pattern)]
           :columns       (into columns (walk/stringify-keys (vec new-columns)))})
        {:success? false
         :message  (format "No results trying to split column '%s' with pattern '%s'"
                           (:title (selected-column args)) (pattern* args))}))))

(defmethod engine/columns-used "core/split-column"
  [applied-transformation columns]
  [(:columnName (:selectedColumn (:args applied-transformation)))])
