(ns akvo.lumen.transformation.split-column
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.string :as string]
            [hugsql.core :as hugsql]
            [clojure.walk :refer (keywordize-keys stringify-keys)])
  (:import [java.util.regex Pattern]))


(defn split-column-analysis [store patterns-fn value]
  (let [freqs (patterns-fn value)]
    (reduce (fn [c [k v]]
              (-> c
                  (assoc-in [:split-column-analysis k]
                            {:max-coincidences-in-one-row (max v (get-in c [k :max-coincidences-in-one-row] 0))
                             :total-row-coincidences      (inc (get-in c [k :total-row-coincidences] 0))
                             :total-coincidences          (+ v (get-in c [k :total-coincidences] 0))})
                  (update :rows inc)))
            store freqs)))

(defn splitable [pattern-fn column-values]
  (reduce
   (fn [store row-value]
     (split-column-analysis store pattern-fn row-value))
   {:rows 0}
   column-values))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn selected-column [args]
  (-> args :selectedColumn))

(defn col-name [args]
  (-> (selected-column args) :columnName))

(defn pattern* [args]
  (-> args :pattern))

(defn new-column-name [args]
  (-> args :newColumnName))

(defmethod engine/valid? :core/split-column
  [op-spec]
  (let [{:keys [onError op args] :as op-spec} (keywordize-keys op-spec)]
    (and (engine/valid-column-name? (col-name args))
         (pattern* args))))

(defn- add-name-to-new-columns
  [columns new-columns]
  (let [next-column-index (engine/next-column-index columns)
        indexes (map engine/derivation-column-name (iterate inc next-column-index))]
    (map #(assoc % :columnName %2 :id %2) new-columns indexes)))

(defn columns-to-extract [prefix number-new-rows selected-column columns]
  (let [base-column (dissoc selected-column :type :columnName)
        new-columns (map #(assoc base-column :title (str prefix "-" %) :type "text")
                         (range 1 (inc number-new-rows)))]
    (add-name-to-new-columns columns new-columns)))

(defn- update-row [conn table-name row-id vals-map]
  (let [r (string/join "," (doall (map (fn [[k v]]
                                         (str (name k) "='" v "'::TEXT")) vals-map)))
        sql (str  "update " table-name " SET "  r " where rnum=" row-id)]
    (log/debug :sql sql)
    (jdbc/execute! conn sql)))

(defmethod engine/apply-operation :core/split-column
  [{:keys [tenant-conn]} table-name columns op-spec]
  (log/debug :engine/apply-operation :core/split-column table-name)
  (jdbc/with-db-transaction [tenant-conn tenant-conn]
    (let [{:keys [onError op args]} (keywordize-keys op-spec)
          column-name               (col-name args)
          pattern                   (pattern* args)
          re-pattern                (re-pattern (Pattern/quote pattern))
          values                    (map (comp str (keyword column-name))
                                         (select-column-data tenant-conn {:table-name table-name :column-name column-name}))
          splitable                 (splitable #(frequencies (re-seq re-pattern %))
                                               values)]
      (if-let [analysis (get-in splitable [:split-column-analysis pattern])]
        (let [_ (log/error :analysis analysis)
              number-new-rows   (inc (:max-coincidences-in-one-row analysis))
              new-columns       (columns-to-extract (new-column-name args) number-new-rows (selected-column args) columns)
              add-db-columns    (doseq [c new-columns]
                                  (add-column tenant-conn {:table-name      table-name
                                                           :column-type     (:type c)
                                                           :new-column-name (:id c)}))
              update-db-columns (->> (select-rnum-and-column tenant-conn {:table-name table-name :column-name column-name})
                                     (map
                                      #(let [value       ((keyword column-name) %)
                                             values      (string/split value  re-pattern)
                                             update-vals (map (fn [a b]
                                                                [(keyword (:id a)) b]) new-columns values)]
                                         (update-row tenant-conn table-name (:rnum %) update-vals)))
                                     doall)]
          {:success?      true
           :execution-log [(format "Splitted column %s with pattern %s" column-name pattern)]
           :columns       (into columns (vec new-columns))})
        {:success? false
         :message (format "No results trying to split column '%s' with pattern '%s'" (:title (selected-column args)) (pattern* args))}))))

