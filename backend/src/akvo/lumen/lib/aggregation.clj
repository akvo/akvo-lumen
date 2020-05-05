(ns akvo.lumen.lib.aggregation
  (:require [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [akvo.lumen.lib.aggregation.pie :as pie]
            [akvo.lumen.lib.aggregation.maps :as a.maps]
            [akvo.lumen.lib.aggregation.line :as line]
            [akvo.lumen.lib.aggregation.bar :as bar]
            [akvo.lumen.lib.aggregation.pivot :as pivot]
            [akvo.lumen.lib.aggregation.scatter :as scatter]
            [akvo.lumen.lib.aggregation.bubble :as bubble]
            [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.walk :as walk]))

(defmulti query*
  (fn [tenant-conn dataset visualisation-type query]
    visualisation-type))

(defmethod query* :default
  [tenant-conn dataset visualisation-type query]
  (lib/bad-request {"message" "Unsupported visualisation type"
                    "visualisationType" visualisation-type
                    "query" query}))

(defn query [tenant-conn dataset-id visualisation-type query]
  (jdbc/with-db-transaction [tenant-tx-conn tenant-conn {:read-only? true}]
    (if-let [dataset (db.dataset/table-name-and-columns-by-dataset-id tenant-tx-conn {:id dataset-id})]
      (try
        (query* tenant-tx-conn (update dataset :columns (comp walk/keywordize-keys vec)) visualisation-type query)
        (catch clojure.lang.ExceptionInfo e
          (log/warn e :query query :visualisation-type visualisation-type)
          (lib/bad-request (merge {:message (.getMessage e)}
                                  (ex-data e)))))
      (lib/not-found {"datasetId" dataset-id}))))


(def vis-aggregation-mapper {"pivot table" "pivot"
                             "line"      "line"
                             "bubble"    "bubble"
                             "area"      "line"
                             "pie"       "pie"
                             "donut"     "donut"
                             "polararea" "pie"
                             "bar"       "bar"
                             "scatter"   "scatter"})

(defn run-visualisation
  [tenant-conn visualisation]
  (let [visualisation (walk/keywordize-keys visualisation)
        [dataset-tag dataset] (dataset/fetch-metadata tenant-conn (:datasetId visualisation))
        aggregation-type (get vis-aggregation-mapper (:visualisationType visualisation))
        [tag query-result] (query tenant-conn
                                  (:datasetId visualisation)
                                  aggregation-type
                                  (:spec visualisation))]
    (when (and (= tag ::lib/ok)
               (= dataset-tag ::lib/ok))
      {:visualisations {(:id visualisation) (assoc visualisation :data query-result)}
       :datasets { (:id dataset) dataset}})))

(defn run-map-visualisation
  [tenant-conn visualisation windshaft-url]
  (let [layers (get-in visualisation [:spec "layers"])]
    (if (some #(get % "datasetId") layers)
      (let [dataset-id (some #(get % "datasetId") layers)
            [map-data-tag map-data] (maps/create tenant-conn windshaft-url (walk/keywordize-keys layers))
            [dataset-tag dataset] (dataset/fetch-metadata tenant-conn dataset-id)]
        (when (and (= map-data-tag ::lib/ok)
                   (= dataset-tag ::lib/ok))
          {:datasets {dataset-id dataset}
           :visualisations {(:id visualisation) (merge visualisation map-data)}
           :metadata {(:id visualisation) map-data}}))
      (let [[map-data-tag map-data] (maps/create tenant-conn windshaft-url (walk/keywordize-keys layers))]
        (when (= map-data-tag ::lib/ok)
          {:visualisations {(:id visualisation) (merge visualisation map-data)}
           :metadata {(:id visualisation) map-data}})))))

(defn run-unknown-type-visualisation
  [tenant-conn visualisation]
  (let [dataset-id (:datasetId visualisation)
        [tag dataset] (dataset/fetch-metadata tenant-conn dataset-id)]
    (when (= tag ::lib/ok)
      {:datasets {dataset-id dataset}
       :visualisations {(:id visualisation) visualisation}})))

(defmulti merge-dashboard-filters
  "Merge dashboard filters into applicable visualisation spec and mark filter
  status."
  (fn [{:keys [visualisationType]} _]
    visualisationType))

(defmethod merge-dashboard-filters "map" [visualisation filters]
  (let [layers (-> visualisation :spec (get "layers"))
        map-datasets-ids (reduce (fn [ids {:strs [datasetId]}]
                                   (conj ids datasetId))
                                 #{}
                                 layers)]
    (cond
      (not (contains? map-datasets-ids (:datasetId filters)))
      (assoc visualisation :filterAffected false)

      :else
      (-> visualisation
          (assoc :filterAffected true)
          (a.maps/add-filters filters)))))

(defmethod merge-dashboard-filters :default [visualisation filters]
  (cond
    (not (= (:datasetId visualisation) ;; Valid filter but no match on datasets
            (:datasetId filters)))
    (assoc visualisation :filterAffected false)

    :else ;; Valid filter and matching dataset
    (-> visualisation
        (update-in [:spec "filters"] #(concat % (filter :value (:columns filters))))
        (assoc :filterAffected true))))

(defn dashboard-filters [visualisation filters]
  (if (empty? (:columns filters)) ;; No valid filter
    (assoc visualisation :filterAffected false)
    (merge-dashboard-filters visualisation filters)))

(defn visualisation-response-data [tenant-conn id windshaft-url filters]
  (try
    (when-let [vis (-> (visualisation/fetch tenant-conn id)
                       (dashboard-filters filters))]
      (condp contains? (:visualisationType vis)
        #{"map"} (run-map-visualisation tenant-conn vis windshaft-url)
        (set (keys vis-aggregation-mapper)) (run-visualisation tenant-conn vis)
        (run-unknown-type-visualisation tenant-conn vis)))
    (catch Exception e
      (log/warn e ::visualisation-response-data (str "problems fetching this vis-id: " id)))))

(defn aggregate-dashboard-viss [dashboard tenant-conn windshaft-url filters]
  (->> dashboard
       :entities
       vals
       (filter #(= "visualisation" (:type %)))
       (map :id)
       (map #(visualisation-response-data tenant-conn % windshaft-url filters))
       (sort-by #(-> % (get "datasets") vals first (get :rows) boolean))
       (apply merge-with merge)))


(defmethod query* "pivot"
  [tenant-conn dataset _ query]
  (pivot/query tenant-conn dataset query))

(defmethod query* "pie"
  [tenant-conn dataset _ query]
  (pie/query tenant-conn dataset query))

(defmethod query* "donut"
  [tenant-conn dataset _ query]
  (pie/query tenant-conn dataset query))

(defmethod query* "line"
  [tenant-conn dataset _ query]
  (line/query tenant-conn dataset query))

(defmethod query* "bar"
  [tenant-conn dataset _ query]
  (bar/query tenant-conn dataset query))

(defmethod query* "scatter"
  [tenant-conn dataset v-type query]
  (scatter/query tenant-conn dataset query))

(defmethod query* "bubble"
  [tenant-conn dataset v-type query]
  (bubble/query tenant-conn dataset query))


