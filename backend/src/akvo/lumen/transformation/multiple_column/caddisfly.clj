(ns akvo.lumen.transformation.multiple-column.caddisfly
  (:require [akvo.lumen.dataset.utils :as u]
            [akvo.lumen.transformation.engine :as engine]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys)]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(hugsql/def-db-fns "akvo/lumen/transformation/caddisfly.sql")


(def parse-json #(json/parse-string (slurp (io/resource %)) keyword))

(def schemas (->> (:tests (parse-json "./caddisfly/tests-schema.json"))
                  (reduce #(assoc % (:uuid %2) %2) {})))

;; (def has-image-schema-example (get schemas "53a1649a-be67-4a13-8cba-1b7db640037c"))

(defn caddisfly-test-results [cad-val cad-schema columns-to-extract]
  (log/debug ::caddisfly-test-results [cad-val cad-schema columns-to-extract])
  (let [row-val (:result cad-val)
        result  (map
                 (fn [c]
                   (assoc c :value (:value (some #(when (= (:id c) (:id %)) %) row-val))))
                 columns-to-extract)]
    (if (:hasImage cad-schema)
      (vec (cons {:value (:image cad-val)} result))
      result)))

(defn construct-new-columns
  [column columns-to-extract extractImage next-column-index]
  (if-let [caddisflyResourceUuid (:subtypeId column)]
    (let [base-column      (dissoc column :subtypeId :type :subtype :columnName :title)
          caddisfly-schema (get schemas caddisflyResourceUuid)]
      (map #(assoc %2 :columnName % :id %)
           (map engine/int->derivation-column-name (iterate inc next-column-index))
           (cond->>  (map #(assoc base-column :title (:name %) :type (:type %)) columns-to-extract )
             (and (:hasImage caddisfly-schema) extractImage)
             (cons (assoc base-column :type "text" :title (str (:title column) "| Image" ))))))
    ;; TODO:  maybe we need to double check that columsn in columns-extract exists in schema, looking by id
    (throw (ex-info "this column doesn't have a caddisflyResourceUuid currently associated!" {:message {:possible-reason "maybe you don't update the dataset!?"}}))))

(defn update-row [conn table-name row-id vals-map]
  (let [r (string/join "," (doall (map (fn [[k v]]
                                         (str (name k) "='" v "'::TEXT")) vals-map)))
        sql (str  "update " table-name " SET "  r " where rnum=" row-id)]
    (log/debug :sql sql)
    (jdbc/execute! conn sql)))

(defn col-name [op-spec]
  (get (engine/args op-spec) "columnName"))

(defn set-cells-values! [conn opts data]
  (->> data
       (map (fn [[i v]] (set-cell-value conn (merge {:value v :rnum i} opts))))
       doall))

(defn apply-operation 
  [tenant-conn table-name columns columns-to-extract {:keys [selectedColumn extractImage] :as args} onError]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [column-name       (:columnName selectedColumn)

          next-column-index (engine/next-column-index columns)

          column-idx        (engine/column-index columns column-name)

          new-columns       (construct-new-columns selectedColumn columns-to-extract extractImage next-column-index)

          cad-schema        (get schemas (:subtypeId selectedColumn))
          add-db-columns (doseq [c new-columns]
                           (add-column conn {:table-name      table-name
                                             :column-type     (:type c)
                                             :new-column-name (:id c)}))
          update-db-columns (->> (caddisfly-data conn {:table-name table-name :column-name column-name})

                                 (map (fn [m]
                                        (let [multiple-value (json/parse-string ((keyword column-name) m) keyword)
                                              cad-results (or (caddisfly-test-results multiple-value cad-schema columns-to-extract)
                                                              (repeat nil))
                                              update-vals (->> (map
                                                                (fn [new-column-name new-column-val]
                                                                  [(keyword new-column-name) new-column-val])
                                                                (map :id new-columns)
                                                                (map :value cad-results))
                                                               (reduce #(apply assoc % %2) {}))]
                                          (update-row conn table-name (:rnum m) update-vals))))
                                 doall)
          delete-db-column (delete-column conn {:table-name table-name :column-name column-name})]
      (log/debug :db-ops add-db-columns update-db-columns delete-db-column)      
      {:success?      true
       :execution-log [(format "Extract caddisfly column %s" column-name)]
       :columns
       (into (into (vec (take column-idx columns)) ;; same approach as delete column
                   (drop (inc column-idx) columns))
             (vec new-columns))})))
