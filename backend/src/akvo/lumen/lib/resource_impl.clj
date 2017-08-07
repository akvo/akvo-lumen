(ns akvo.lumen.lib.resource-impl
  (:require [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/resource.sql")


(defn current-plan [tenant-conn]
  (if-let [r (select-plan tenant-conn)]
    r
    {"tier" "planless"}))

(defn count-visualisation-fn [tenant-conn _]
  (:numberOfVisualisations (count-visualisations tenant-conn
                                                 {}
                                                 {}
                                                 {:identifiers identity})))

(defn data-update-fn [_ _]
  "auto")

(def policy-map
  {"number_of_visualisations" count-visualisation-fn
   "data_update" data-update-fn})

(defn get-resources [tenant-conn tier]
  (let [policies (select-policies tenant-conn)]
    (reduce merge
            (map (fn [{:keys [title]}]
                   {title ((get policy-map title) tenant-conn tier)})
                 policies))))

(defn all [tenant-conn]
  (let [plan (current-plan tenant-conn)]
    (response {"plan" plan
               "resources" (get-resources tenant-conn (:tier plan))
               })))
