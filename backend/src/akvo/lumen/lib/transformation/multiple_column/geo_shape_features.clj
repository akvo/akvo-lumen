(ns akvo.lumen.lib.transformation.multiple-column.geo-shape-features
  (:require [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.component.caddisfly :refer (get-schema)]
            [akvo.lumen.lib.multiple-column :as multiple-column]
            [cheshire.core :as json]
            [clojure.walk :as walk]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(hugsql/def-db-fns "akvo/lumen/lib/transformation/engine.sql")

(defn- add-name-to-new-columns
  [current-columns columns-to-extract]
  (let [next-column-index (engine/next-column-index current-columns)
        indexes (map engine/derivation-column-name (iterate inc next-column-index))]
    (map #(assoc % :columnName %2 :id %2) columns-to-extract indexes)))

(defn- update-row [conn table-name row-id vals-map]
  (let [vals-map (filter (fn [[k v :as x]]
                           (when v x)) vals-map)
        r (string/join "," (doall (map (fn [[k v]]
                                         (str (name k) "=" (or v nil))) vals-map)))
        sql (str  "update " table-name " SET "  r " where rnum=" row-id)]
    (log/warn :sql sql)
    (when (seq vals-map)
      (jdbc/execute! conn sql))))

(defn columns-to-extract [columns selected-column caddisfly-schema extractImage]
  (let [columns   (filter :extract columns)
        base-column (dissoc selected-column :multipleId :type :multipleType :columnName :title)]
    (map #(assoc base-column :title (:name %) :type (:type %) :internal-id (:id %)) columns)))

(defn- multiple-cell-value
  "get json parsed value from cell row"
  [row column-name]
  (json/parse-string ((keyword column-name) row) keyword))

(defn- test-results
  "`test`-results in caddisfly terminology means the values extracted of caddisfly samples.
  This function assoc values from json parsed data to selected columns to extract."
  [cell-value columns-to-extract]
  (log/error :cell-value cell-value)
  (log/error :columns-to-extract columns-to-extract)
  (map (fn [c]
         (when-let [v ((keyword (:name
                            (some  #(when (= (:id %) (:internal-id c)) %) multiple-column/geo-shape-columns)
                            )) cell-value)]
           (Double/parseDouble (string/replace v "," "."))))
       columns-to-extract))

(defn apply-operation 
  [{:keys [tenant-conn caddisfly] :as deps} table-name current-columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [onError op args]} op-spec
          selected-column (find-column (walk/keywordize-keys current-columns) (-> args :selectedColumn :columnName))

          caddisfly-schema nil

          new-columns (->> (columns-to-extract (:columns args) selected-column caddisfly-schema (:extractImage args))
                           (add-name-to-new-columns current-columns))
          
          _ (log/debug ::apply-operation table-name (:columnName selected-column) onError)
          _ (log/debug :new-columns new-columns :selected-column selected-column :extractImage (:extractImage args))

          add-db-columns (doseq [c new-columns]
                           (add-column conn {:table-name      table-name
                                             :column-type     (postgres/colum-type-fn* (:type c))
                                             :new-column-name (:id c)}))
          update-db-columns (->> (select-rnum-and-column conn {:table-name table-name :column-name (:columnName selected-column)})
                                 (map
                                  (fn [m] 
                                    (let [cell-value (multiple-cell-value m (:columnName selected-column))
                                          cad-results (or (test-results cell-value new-columns)
                                                          (repeat nil))
                                          update-vals (->> (map
                                                            (fn [new-column-name new-column-val]
                                                              [(keyword new-column-name) new-column-val])
                                                            (map :id new-columns)
                                                            cad-results)
                                                           (reduce #(apply assoc % %2) {}))]
                                      (log/warn :update-vals update-vals)
                                      (update-row conn table-name (:rnum m) update-vals))))
                                 doall)]
      (log/debug :db-txs selected-column add-db-columns update-db-columns)
      {:success?      true
       :execution-log [(format "Extract caddisfly column %s" (:columnName selected-column))]
       :columns       (into current-columns (vec new-columns))})))
