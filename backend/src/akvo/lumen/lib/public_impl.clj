(ns akvo.lumen.lib.public-impl
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [cheshire.core :as json]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/public.sql")

(defn get-share [tenant-conn id]
  (public-by-id tenant-conn {:id id}))

(defmulti visualisation (fn [_ visualisation]
                          (:visualisationType visualisation)))

(defmethod visualisation "pivot table"
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        [tag query-result] (aggregation/query tenant-conn
                                              dataset-id
                                              "pivot"
                                              (:spec visualisation))]
    (when (= tag ::lib/ok)
      {"visualisations" {(:id visualisation) (assoc visualisation :data query-result)}})))

(defmethod visualisation "pie"
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        [tag query-result] (aggregation/query tenant-conn
                                              dataset-id
                                              "pie"
                                              (:spec visualisation))]
    (when (= tag ::lib/ok)
      {"visualisations" {(:id visualisation) (assoc visualisation :data query-result)}})))

(defmethod visualisation "donut"
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        [tag query-result] (aggregation/query tenant-conn
                                              dataset-id
                                              "pie"
                                              (:spec visualisation))]
    (when (= tag ::lib/ok)
      {"visualisations" {(:id visualisation) (assoc visualisation :data query-result)}})))

(defmethod visualisation :default
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        [tag dataset] (dataset/fetch tenant-conn dataset-id)]
    (when (= tag ::lib/ok)
      {"datasets" {dataset-id dataset}
       "visualisations" {(:id visualisation) visualisation}})))

(defn visualisation-response-data [tenant-conn id]
  (let [[tag vis] (visualisation/fetch tenant-conn id)]
    (when (= tag ::lib/ok)
      (visualisation tenant-conn vis))))

(defn dashboard-response-data [tenant-conn id]
  (let [[tag dashboard] (dashboard/fetch tenant-conn id)]
    (when (= tag ::lib/ok)
      (let [deps (->> dashboard
                      :entities
                      vals
                      (filter #(= "visualisation" (get % "type")))
                      (map #(get % "id"))
                      (map #(visualisation-response-data tenant-conn %))
                      (apply merge-with merge))]
        (assoc deps "dashboards" {id dashboard})))))

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
    (lib/ok (response-data tenant-conn share))
    (lib/not-found {"shareId" id})))
