(ns akvo.lumen.lib.public-impl
  (:require [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.pivot :as pivot]
            [akvo.lumen.lib.visualisation :as visualisation]
            [cheshire.core :as json]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [content-type not-found response]]))

(hugsql/def-db-fns "akvo/lumen/lib/public.sql")

(defn get-share [tenant-conn id]
  (public-by-id tenant-conn {:id id}))

(defmulti visualisation (fn [_ visualisation]
                          (:visualisationType visualisation)))

(defmethod visualisation "pivot table"
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        {:keys [status body]} (pivot/query tenant-conn dataset-id (:spec visualisation))]
    (when (= status 200)
      {"visualisations" {(:id visualisation) (assoc visualisation :data body)}})))

(defmethod visualisation :default
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        {:keys [status body]} (dataset/fetch tenant-conn dataset-id)]
    (when (= status 200)
      {"datasets" {dataset-id body}
       "visualisations" {(:id visualisation) visualisation}})))

(defn visualisation-response-data [tenant-conn id]
  (let [{:keys [status body]} (visualisation/fetch tenant-conn id)]
    (when (= status 200)
      (visualisation tenant-conn body))))

(defn dashboard-response-data [tenant-conn id]
  (let [{:keys [status body]} (dashboard/fetch tenant-conn id)]
    (when (= status 200)
      (let [deps (->> body
                      :entities
                      vals
                      (filter #(= "visualisation" (get % "type")))
                      (map #(get % "id"))
                      (map #(visualisation-response-data tenant-conn %))
                      (apply merge-with merge))]
        (assoc deps "dashboards" {id body})))))

(defn response-data [tenant-conn share]
  (if-let [dashboard-id (:dashboard-id share)]
    (assoc (dashboard-response-data tenant-conn dashboard-id)
           "dashboardId" dashboard-id)
    (let [visualisation-id (:visualisation-id share)]
      (assoc (visualisation-response-data tenant-conn visualisation-id)
             "visualisationId" visualisation-id))))

(defn share
  [tenant-conn id]
  (if-let [share (get-share tenant-conn id)]
    (response (response-data tenant-conn share))
    (not-found {"shareId" id})))
