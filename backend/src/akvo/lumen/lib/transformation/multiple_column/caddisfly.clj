(ns akvo.lumen.lib.transformation.multiple-column.caddisfly
  (:require [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.component.caddisfly :refer (get-schema)]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [akvo.lumen.lib.multiple-column :as multiple-column]
            [clojure.walk :as walk]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(defn columns-to-extract [columns selected-column caddisfly-schema extractImage]
  (let [columns   (filter :extract columns)
        base-column (dissoc selected-column :multipleId :type :multipleType :columnName :title :groupId :groupName)]
    (cond->>
        (map #(assoc base-column :title (:name %) :type (:type %) :caddisfly-test-id (:id %)) columns)
      (and (:hasImage caddisfly-schema) extractImage)
      (cons (with-meta (assoc base-column :type "text" :title (str (:title selected-column) "| Image"))
              {:image true})))))

(defn- test-results
  "`test`-results in caddisfly terminology means the values extracted of caddisfly samples.
  This function assoc values from json parsed data to selected columns to extract."
  [cell-value columns-to-extract]
  (map (fn [c]
         (if (:image (meta c))
           (:image cell-value)
           (:value (some #(when (= (:caddisfly-test-id c) (:id %)) %) (:result cell-value)))))
   columns-to-extract))

(defn apply-operation 
  [{:keys [tenant-conn caddisfly] :as deps} dataset-versions op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [onError op args]} op-spec
          namespace (engine/get-namespace op-spec)
          dsv (get dataset-versions namespace)
          columns (vec (:columns dsv))
          selected-column (find-column (walk/keywordize-keys columns) (-> args :selectedColumn :columnName))
          caddisfly-schema (if-let [multipleId (:multipleId selected-column)]
                             (get-schema caddisfly multipleId)
                             (throw
                              (ex-info "this column doesn't have a caddisflyResourceUuid currently associated!"
                                       {:message
                                        {:possible-reason "maybe you don't update the flow dataset!? (via client dashboard ...)"}})))

          new-columns (->> (columns-to-extract (:columns args) selected-column caddisfly-schema (:extractImage args))
                           (multiple-column/add-name-to-new-columns columns))]
      (if-let [errors (->> (map :title new-columns)
                           (filter #(engine/column-title-error? % columns))
                           not-empty)]
        {:success? false
         :message  (map :message errors)}
        (let [_ (log/debug ::apply-operation (:table-name dsv) (:columnName selected-column) onError)
              _ (log/debug :new-columns new-columns :selected-column selected-column :extractImage (:extractImage args))

              add-db-columns    (doseq [c new-columns]
                                  (db.tx.engine/add-column conn {:table-name (:table-name dsv)
                                                                 :column-type     (:type c)
                                                                 :new-column-name (:id c)}))
              update-db-columns (->> (db.transformation/select-rnum-and-column conn {:table-name (:table-name dsv)
                                                                                     :column-name (:columnName selected-column)})
                                     (map
                                      (fn [m]
                                        (let [cell-value  (multiple-column/multiple-cell-value m (:columnName selected-column))
                                              cad-results (or (test-results cell-value new-columns)
                                                              (repeat nil))
                                              update-vals (->> (map
                                                                (fn [new-column-name new-column-val]
                                                                  [(keyword new-column-name) new-column-val])
                                                                (map :id new-columns)
                                                                cad-results)
                                                               (reduce #(apply assoc % %2) {}))]
                                          (log/debug :update-vals update-vals)
                                          (multiple-column/update-row conn (:table-name dsv) (:rnum m) update-vals "NULL"))))
                                     doall)
              res-columns (into columns (vec (walk/stringify-keys new-columns)))]
          (log/debug :db-txs selected-column add-db-columns update-db-columns)
          {:success?      true
           :execution-log [(format "Extract caddisfly column %s" (:columnName selected-column))]
           :dataset-versions (vals (-> dataset-versions
                                           (assoc-in [namespace :columns] res-columns)
                                           (update-in ["main" :transformations]
                                                      engine/update-dsv-txs op-spec columns res-columns)))})))))
