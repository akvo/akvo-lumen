(ns akvo.lumen.db.dataset
  (:require [hugsql.core :as hugsql]
            [clojure.tools.logging :as log]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn dataset-by-id [conn opts]
  (first (dataset-by-id* conn opts)))

(defn dataset-by-id-v2 [conn opts]
  (let [rcol (dataset-by-id* conn opts)
        commons-keys [:updated :created :source :modified :title :author :id]
        specific-keys [:transformations :columns :table-name]
        f (first rcol)]
    (assoc (select-keys f commons-keys)
           :table-names (mapv :table-name rcol)
           :group-ds (reduce (fn [c ds]
                               (let [ds-groups (map #(get % "groupId") (:columns ds))]
                                 (reduce #(assoc % %2 (select-keys ds specific-keys)) c ds-groups))) {} rcol))))
