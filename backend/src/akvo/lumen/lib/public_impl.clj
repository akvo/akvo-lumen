(ns akvo.lumen.lib.public-impl
  (:require [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [cheshire.core :as json]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [content-type not-found response]]))


(hugsql/def-db-fns "akvo/lumen/lib/public.sql")


(defn get-share
  [conn id]
  (public-by-id conn {:id id}))

(defmulti response-data
  (fn [_ share]
    (cond
      (not (nil? (:visualisation_id share))) :visualisation
      (not (nil? (:dashboard_id share))) :dashboard)))

(defmethod response-data :visualisation
  [tenant-conn share]

  (let [v (:body (visualisation/fetch tenant-conn (:visualisation_id share)))
        d (:body (dataset/fetch tenant-conn (:datasetId v)))]
    {"visualisation" (dissoc v :id :created :modified)
     "datasets" {(:id d) d}}))

(defn- visualisation-id-list
  [dashboard]
  (->> dashboard
       :entities
       vals
       (filter #(= "visualisation" (get % "type")))
       (mapv #(get % "id"))))

(defn visualisation-list [tenant-conn visualisation-ids]
  (reduce conj {} (map (fn [v-id]
                         {v-id (:body (visualisation/fetch tenant-conn v-id))})
                       visualisation-ids)))

(defn dataset-list
  [tenant-conn visualisations]
  (let [dataset-ids (vec (reduce conj #{} (map :datasetId
                                               (vals visualisations))))]
    (reduce conj {} (map (fn [d-id]
                           {d-id (:body (dataset/fetch tenant-conn d-id))})
                         dataset-ids))))

(defmethod response-data :dashboard
  [tenant-conn share]
  (let [dashboard (:body (dashboard/fetch tenant-conn (:dashboard_id share)))
        visualisation-ids (visualisation-id-list dashboard)
        visualisations (visualisation-list tenant-conn visualisation-ids)
        datasets (dataset-list tenant-conn visualisations)]
    {"dashboard" dashboard
     "visualisations" visualisations
     "datasets" datasets}))

(defn share
  [tenant-conn id]
  (if-let [share (get-share tenant-conn id)]
    (response (response-data tenant-conn share))
    (not-found {"shareId" id})))
