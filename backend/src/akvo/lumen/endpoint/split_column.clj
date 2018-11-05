(ns akvo.lumen.endpoint.split-column
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [cheshire.core :as json]
            [akvo.lumen.lib :as lib]
            [compojure.core :refer :all]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]
            [integrant.core :as ig]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(defn split-column-analysis [store value]
  (let [regex "[^a-zA-Z0-9\\s]"
        freqs (frequencies (re-seq (re-pattern regex) value))]    
    (reduce (fn [c [k v]]
              (-> c
                  (assoc-in [:split-column-analysis k]
                            {:max-coincidences-in-one-row (max v (get-in c [k :max-coincidences-in-one-row] 0))
                             :total-row-coincidences      (inc (get-in c [k :total-row-coincidences] 0))
                             :total-coincidences          (+ v (get-in c [k :total-coincidences] 0))})
                  (update :rows inc)))
            store freqs)))

;;column (first (filter #(= k (:id %)) columns))
;;when (= :text (:type column))
(defn splitable [column-values]
  (reduce
   (fn [store row-value]
     (split-column-analysis store row-value))
   {:rows 0}
   column-values))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/split-column" {:keys [query-params tenant] :as request}
           (context "/:dataset-id" [dataset-id]
                    (GET "/analysis" _
                         (let [query           (json/parse-string (get query-params "query") keyword)
                               tenant-conn     (connection tenant-manager tenant)
                               dataset-version (latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
                               sql-query       {:table-name  (:table-name dataset-version)
                                                :column-name (:columnName query)
                                                :limit       (str (:limit query "200"))}]
                           (lib/ok (splitable (map (comp str (keyword (:columnName query))) (select-random-column-data tenant-conn sql-query)))))))))

(defmethod ig/init-key :akvo.lumen.endpoint.split-column/endpoint  [_ opts]
  (endpoint opts))
