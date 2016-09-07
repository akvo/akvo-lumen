(ns org.akvo.lumen.lib.public-impl
  (:require [hugsql.core :as hugsql]
            [org.akvo.lumen.lib.dataset :as dataset]
            [org.akvo.lumen.lib.visualisation :as visualisation]
            [org.akvo.lumen.lib.dashboard :refer [handle-dashboard-by-id]]))


(hugsql/def-db-fns "org/akvo/lumen/lib/public.sql")


(defn get-share
  [conn id]
  (public-by-id conn {:id id}))

(defmulti response-data
  (fn [_ share]
    (cond
      (not (nil? (:visualisation_id share))) :visualisation
      (not (nil? (:dashboard_id share)))     :dashboard)))

(defmethod response-data :visualisation
  [tenant-conn share]
  (let [v (visualisation/fetch tenant-conn (:visualisation_id share))
        d (dataset/fetch tenant-conn (:datasetId v))]
    {"visualisation" (dissoc v :id :created :modified)
     "datasets"      {(:id d) d}}))

(defn- visualisation-id-list
  [dashboard]
  (->> dashboard
       :entities
       vals
       (filter #(= "visualisation" (get % "type")))
       (mapv #(get % "id"))))

(defn visualisation-list [tenant-conn visualisation-ids]
  (reduce conj {} (map (fn [v-id]
                         {v-id (visualisation/fetch tenant-conn v-id)})
                       visualisation-ids)))

(defn dataset-list
  [tenant-conn visualisations]
  (let [dataset-ids (vec (reduce conj #{} (map :datasetId
                                               (vals visualisations))))]
    (reduce conj {} (map (fn [d-id]
                           {d-id (dataset/fetch tenant-conn d-id)})
                         dataset-ids))))

(defmethod response-data :dashboard
  [tenant-conn share]
  (let [dashboard (handle-dashboard-by-id tenant-conn (:dashboard_id share))
        visualisation-ids (visualisation-id-list dashboard)
        visualisations (visualisation-list tenant-conn visualisation-ids)
        datasets (dataset-list tenant-conn visualisations)]
    {"dashboard"      dashboard
     "visualisations" visualisations
     "datasets"       datasets}))

(defn share
  [tenant-conn id]
  (if-let [share (get-share tenant-conn id)]
    (response-data tenant-conn share)))
