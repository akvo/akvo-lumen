(ns akvo.lumen.transformation.multiple-column.caddisfly
  (:require [akvo.lumen.transformation.engine :as engine]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn- get-caddisfly-schema
  [caddisfly column]
  (if-let [caddisflyResourceUuid (:multipleId column)]
    (get (:schema caddisfly) caddisflyResourceUuid)
    (throw
     (ex-info "this column doesn't have a caddisflyResourceUuid currently associated!"
              {:message
               {:possible-reason "maybe you don't update the flow dataset!? (via client dashboard ...)"}}))))

(defn- add-name-to-new-columns
  [current-columns columns-to-extract]
  (let [next-column-index (engine/next-column-index current-columns)
        indexes (map engine/derivation-column-name (iterate inc next-column-index))]
    (map #(assoc % :columnName %2 :id %2) columns-to-extract indexes)))

(defn- update-row [conn table-name row-id vals-map]
  (let [r (string/join "," (doall (map (fn [[k v]]
                                         (str (name k) "='" v "'::TEXT")) vals-map)))
        sql (str  "update " table-name " SET "  r " where rnum=" row-id)]
    (log/debug :sql sql)
    (jdbc/execute! conn sql)))

(defn columns-to-extract [columns selected-column caddisfly-schema extractImage]
  (let [columns   (filter :extract columns)
        base-column (dissoc selected-column :multipleId :type :multipleType :columnName :title)]
    (cond->>
        (map #(assoc base-column :title (:name %) :type (:type %) :caddisfly-test-id (:id %)) columns)
      (and (:hasImage caddisfly-schema) extractImage)
      (cons (with-meta (assoc base-column :type "text" :title (str (:title selected-column) "| Image"))
              {:image true})))))

(defn multiple-cell-value
  "get json parsed value from cell row"
  [row column-name]
  (json/parse-string ((keyword column-name) row) keyword))

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
  [{:keys [tenant-conn caddisfly] :as deps} table-name current-columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [onError op args]} op-spec

          selected-column (-> args :selectedColumn)

          caddisfly-schema (get-caddisfly-schema caddisfly selected-column)

          new-columns (->> (columns-to-extract (:columns args) selected-column caddisfly-schema (:extractImage args))
                           (add-name-to-new-columns current-columns))
          
          _ (log/debug ::apply-operation table-name (:columnName selected-column) onError)
          _ (log/debug :new-columns new-columns :selected-column selected-column :extractImage (:extractImage args))

          add-db-columns (doseq [c new-columns]
                           (add-column conn {:table-name      table-name
                                             :column-type     (:type c)
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
                                      (log/debug :update-vals update-vals)
                                      (update-row conn table-name (:rnum m) update-vals))))
                                 doall)]
      (log/info :db-txs selected-column add-db-columns update-db-columns)
      {:success?      true
       :execution-log [(format "Extract caddisfly column %s" (:columnName selected-column))]
       :columns       (into current-columns (vec new-columns))})))
