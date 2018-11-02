(ns akvo.lumen.endpoint.split-column
  (:require [cheshire.core :as json]
            [compojure.core :refer :all]
            [integrant.core :as ig]
            [hugsql.core :as hugsql]))

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

(splitable ["ab$c" "ac$g" "12%34"])

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/split-column" {:keys [query-params] :as request}
           (GET "/analysis" _
                (let [query (json/parse-string (get query-params "query") keyword)]
                  (select-random-column-data tenant-manager {:table-name (:tableName query)
                                                             :column-name (:columnName query)
                                                             :limit 200})))))

(defmethod ig/init-key :akvo.lumen.endpoint.split-column/endpoint  [_ opts]
  (endpoint opts))
