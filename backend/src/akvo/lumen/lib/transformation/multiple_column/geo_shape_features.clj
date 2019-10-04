(ns akvo.lumen.lib.transformation.multiple-column.geo-shape-features
  (:require [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.lib.multiple-column :as multiple-column]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [clojure.walk :as walk]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(defn columns-to-extract [columns selected-column extractImage]
  (let [columns   (filter :extract columns)
        base-column (dissoc selected-column :multipleId :type :multipleType :columnName :title)]
    (map #(assoc base-column :title (:name %) :type (:type %) :internal-id (:id %)) columns)))

(defn- extract-values
  [cell-value columns-to-extract]
  (log/debug :cell-value cell-value :columns-to-extract columns-to-extract)
  (map (fn [c]
         (when-let [v ((keyword (:name
                                 (some  #(when (= (:id %) (:internal-id c)) %) multiple-column/geo-shape-columns)))
                       cell-value)]
           (Double/parseDouble (string/replace v "," "."))))
       columns-to-extract))

(defn apply-operation 
  [{:keys [tenant-conn caddisfly] :as deps} table-name current-columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [onError op args]} op-spec
          selected-column (find-column (walk/keywordize-keys current-columns) (-> args :selectedColumn :columnName))

          new-columns (->> (columns-to-extract (:columns args) selected-column (:extractImage args))
                           (multiple-column/add-name-to-new-columns current-columns))
          
          _ (log/debug ::apply-operation table-name (:columnName selected-column) onError)
          _ (log/debug :new-columns new-columns :selected-column selected-column :extractImage (:extractImage args))

          add-db-columns (doseq [c new-columns]
                           (db.tx.engine/add-column conn {:table-name      table-name
                                             :column-type     (postgres/colum-type-fn* (:type c))
                                             :new-column-name (:id c)}))
          update-db-columns (->> (db.transformation/select-rnum-and-column conn {:table-name table-name :column-name (:columnName selected-column)})
                                 (map
                                  (fn [m] 
                                    (let [cell-value (multiple-column/multiple-cell-value m (:columnName selected-column))
                                          cad-results (or (extract-values cell-value new-columns)
                                                          (repeat nil))
                                          update-vals (->> (map
                                                            (fn [new-column-name new-column-val]
                                                              [(keyword new-column-name) new-column-val])
                                                            (map :id new-columns)
                                                            cad-results)
                                                           (reduce #(apply assoc % %2) {})
                                                           (filter (fn [[k v :as x]] (when v x))))]
                                      (log/debug :update-vals update-vals)
                                      (multiple-column/update-row conn table-name (:rnum m) update-vals nil))))
                                 doall)]
      (log/debug :db-txs selected-column add-db-columns update-db-columns)
      {:success?      true
       :execution-log [(format "Extract caddisfly column %s" (:columnName selected-column))]
       :columns       (into current-columns (vec new-columns))})))
