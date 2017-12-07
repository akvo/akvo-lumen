(ns akvo.lumen.lib.public-impl
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [cheshire.core :as json]
            [clojure.set :as set]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/public.sql")

(defn get-share [tenant-conn id]
  (public-by-id tenant-conn {:id id}))

(defmulti visualisation (fn [_ visualisation config]
                          (:visualisationType visualisation)))

(defmethod visualisation "pivot table"
  [tenant-conn visualisation config]
  (let [dataset-id (:datasetId visualisation)
        [tag query-result] (aggregation/query tenant-conn
                                              dataset-id
                                              "pivot"
                                              (:spec visualisation))]
    (when (= tag ::lib/ok)
      {"visualisations" {(:id visualisation) (assoc visualisation :data query-result)}})))

(defmethod visualisation "pie"
  [tenant-conn visualisation config]
  (let [dataset-id (:datasetId visualisation)
        [tag query-result] (aggregation/query tenant-conn
                                              dataset-id
                                              "pie"
                                              (:spec visualisation))]
    (when (= tag ::lib/ok)
      {"visualisations" {(:id visualisation) (assoc visualisation :data query-result)}})))

(defmethod visualisation "donut"
  [tenant-conn visualisation config]
  (let [dataset-id (:datasetId visualisation)
        [tag query-result] (aggregation/query tenant-conn
                                              dataset-id
                                              "pie"
                                              (:spec visualisation))]
    (when (= tag ::lib/ok)
      {"visualisations" {(:id visualisation) (assoc visualisation :data query-result)}})))

(defmethod visualisation "map"
  [tenant-conn visualisation {:keys [windshaft-url]}]
  (let [dataset-id (:datasetId visualisation)
        layer (get-in visualisation [:spec "layers" 0])
        [map-data-tag map-data] (maps/create tenant-conn windshaft-url dataset-id layer)
        [dataset-tag dataset] (dataset/fetch tenant-conn dataset-id)]
    (when (and (= map-data-tag ::lib/ok)
               (= dataset-tag ::lib/ok))
      {"datasets" {dataset-id (dissoc dataset :rows)}
       "visualisations" {(:id visualisation) (merge visualisation map-data)}})))

(defmethod visualisation :default
  [tenant-conn visualisation config]
  (let [dataset-id (:datasetId visualisation)
        [tag dataset] (dataset/fetch tenant-conn dataset-id)]
    (when (= tag ::lib/ok)
      {"datasets" {dataset-id dataset}
       "visualisations" {(:id visualisation) visualisation}})))

(defn visualisation-response-data [tenant-conn id config]
  (let [[tag vis] (visualisation/fetch tenant-conn id)]
    (when (= tag ::lib/ok)
      (visualisation tenant-conn vis config))))

(defn dashboard-response-data [tenant-conn id config]
  (let [[tag dashboard] (dashboard/fetch tenant-conn id)]
    (when (= tag ::lib/ok)
      (let [deps (->> dashboard
                      :entities
                      vals
                      (filter #(= "visualisation" (get % "type")))
                      (map #(get % "id"))
                      (map #(visualisation-response-data tenant-conn % config))
                      (sort-by #(-> % (get "datasets") vals first (get :rows) boolean))
                      (apply merge-with merge))]
        (assoc deps "dashboards" {id dashboard})))))

(defn response-data [tenant-conn share config]
  (if-let [dashboard-id (:dashboard-id share)]
    (assoc (dashboard-response-data tenant-conn dashboard-id config)
           "dashboardId" dashboard-id)
    (let [visualisation-id (:visualisation-id share)]
      (assoc (visualisation-response-data tenant-conn visualisation-id config)
             "visualisationId" visualisation-id))))

(defn share
  [tenant-conn config id]
  (if-let [share (get-share tenant-conn id)]
    (lib/ok (response-data tenant-conn share config))
    (lib/not-found {"shareId" id})))
