(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.http.client :as http.client]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.postgres.filter :as filter]
            [akvo.lumen.lib.data-group :as data-group]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.visualisation.map-config :as map-config]
            [akvo.lumen.lib.visualisation.map-metadata :as map-metadata]
            [clojure.tools.logging :as log]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.core.match :refer [match]]
            [clojure.walk :as walk]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.lib.dataset.utils :refer (find-column)]
            [akvo.lumen.db.raster :as db.raster])
  (:import [com.zaxxer.hikari HikariDataSource]
           [java.net URI]))

(def http-client-req-defaults (http.client/req-opts 10000))

(defn- headers [tenant-conn]
  (let [db-uri (-> ^HikariDataSource (:datasource tenant-conn)
                   .getJdbcUrl
                   (subs 5)
                   URI.)
        {:keys [password user]} (util/query-map (.getQuery db-uri))
        port (let [p (.getPort db-uri)]
               (if (pos? p) p 5432))
        db-name (subs (.getPath db-uri) 1)]
    {"x-db-host" (.getHost db-uri)
     "x-db-last-update" (quot (System/currentTimeMillis) 1000)
     "x-db-password" password
     "x-db-port" port
     "X-db-name" db-name
     "x-db-user" user}))

(defn- check-columns
  "Make sure supplied columns are distinct and satisfy predicate."
  [p & columns]
  (and (= (count columns)
          (count (into #{} columns)))
       (every? p columns)))

(def ^:private valid-aggregation-methods #{"avg" "count" "sum" "max" "min"})

(defn validate-layer-columns
  "Ensure every user-supplied column field in a map layer names a real column of
  the dataset it is read from, before those fields are used to build SQL.

  Two distinct datasets are in play: `popup` columns and `shapeLabelColumn` are
  selected from the shape dataset (`shape-columns`); `aggregationColumn` and
  `aggregationGeomColumn` are read from the aggregation dataset (`agg-columns`).
  Validating the aggregation fields against the shape columns would both reject
  valid maps and let unchecked names through, so the caller must pass the
  correct column sets.

  Aggregation fields (and `aggregationMethod`) only reach SQL when the aggregation
  path is active — all of `aggregationDataset`/`aggregationColumn`/
  `aggregationGeomColumn` present — so they are validated only in that case.
  Raster layers reach none of these code paths and are skipped.

  Returns the layer unchanged on success; throws `ex-info` on the first invalid
  field (via `find-column`, or directly for `aggregationMethod`)."
  [{:keys [layerType popup shapeLabelColumn aggregationDataset aggregationColumn
           aggregationGeomColumn aggregationMethod] :as layer}
   shape-columns agg-columns]
  (when (not= layerType "raster")
    (doseq [{:keys [column]} popup]
      (find-column shape-columns column))
    (when shapeLabelColumn
      (find-column shape-columns shapeLabelColumn))
    (when (and aggregationDataset aggregationColumn aggregationGeomColumn)
      (find-column agg-columns aggregationColumn)
      (find-column agg-columns aggregationGeomColumn)
      (when (and aggregationMethod
                 (not (contains? valid-aggregation-methods aggregationMethod)))
        (throw (ex-info (str "Invalid aggregationMethod: " aggregationMethod)
                        {:aggregationMethod aggregationMethod})))))
  layer)

(defn valid-location?
  "Validate map spec layer."
  [layer p]
  (let [m (into {} (remove (comp nil? val)
                           (select-keys layer [:geom :latitude :longitude])))]
    (match [m]
           [({:geom geom} :only [:geom])] (p geom)

           [({:geom geom :latitude latitude} :only [:geom :latitude])]
           (check-columns p geom latitude)

           [({:geom geom :longitude longitude} :only [:geom :longitude])]
           (check-columns p geom longitude)

           [({:latitude latitude :longitude longitude}
             :only [:latitude :longitude])]
           (check-columns p latitude longitude)

           [{:geom geom :latitude latitude :longitude longitude}]
           (check-columns p geom latitude longitude)

           :else false)))

(defn conform-create-args [tenant-conn layers]
  (let [dataset-id (->> layers
                        (filter (fn[layer] (util/valid-dataset-id? (:datasetId layer))))
                        first
                        :datasetId)
        raster-id (->> layers
                       (filter (fn[layer] (util/valid-dataset-id? (:rasterId layer))))
                       first
                       :rasterId)
        non-raster-layers (remove #(= (:layerType %) "raster") layers)]
    (cond
      (and (not dataset-id) (not raster-id))
      (throw (ex-info "No valid datasetID"
                      {"reason" "No valid datasetID"}))

      (some (fn [layer] (not (valid-location? layer util/valid-column-name?)))
            non-raster-layers)
      (throw (ex-info "Location spec not valid"
                      {"reason" "Location spec not valid"}))

      :else
      (do
        ;; Check every column field against the columns of the dataset it is
        ;; actually read from. popup + shapeLabelColumn come from the shape
        ;; dataset (:datasetId); the aggregation fields come from the aggregation
        ;; dataset (:aggregationDataset). Runs on stored specs at render time too,
        ;; so existing specs are checked without needing a migration.
        (doseq [layer non-raster-layers]
          (let [shape-columns (walk/keywordize-keys
                               (:columns (db.dataset/dataset-by-id
                                          tenant-conn {:id (:datasetId layer)})))
                agg-columns   (when (:aggregationDataset layer)
                                (walk/keywordize-keys
                                 (:columns (db.dataset/dataset-by-id
                                            tenant-conn {:id (:aggregationDataset layer)}))))]
            (validate-layer-columns layer shape-columns agg-columns)))
        [(if (not dataset-id) raster-id dataset-id)]))))

(defn create-raster [tenant-conn windshaft-url raster-id]
  (let [{:keys [raster_table metadata]} (db.raster/raster-by-id tenant-conn {:id raster-id})
        headers* (headers tenant-conn)
        url (format "%s/layergroup" windshaft-url)
        map-config (map-config/build-raster raster_table (:min metadata) (:max metadata))
        _ (log/debug :map-config map-config)
        layer-group-id (-> (http.client/post* url (merge http-client-req-defaults
                                                         {:body (json/encode map-config)
                                                          :headers headers*
                                                          :content-type :json}))
                           :body json/decode (get "layergroupid"))
        layer-meta (map-metadata/build tenant-conn raster_table {:layerType "raster"} nil nil)]
    (lib/ok {:layerGroupId layer-group-id
             :layerMetadata layer-meta})))

(defn metadata-layers [tenant-conn layers opts]
  (map (fn [current-layer]
         (let [current-layer-type (:layerType current-layer)
               current-dataset-id (if (= current-layer-type "raster")
                                    (:rasterId current-layer)
                                    (:datasetId current-layer))
               {:keys [table-name columns raster_table]} (if (= current-layer-type "raster")
                                                           (db.raster/raster-by-id tenant-conn {:id current-dataset-id})
                                                           (if (-> (env/all tenant-conn) (get "data-groups"))
                                                             (or (data-group/create-view-from-data-groups tenant-conn current-dataset-id)
                                                                 (db.dataset/dataset-by-id tenant-conn {:id current-dataset-id}))
                                                             (db.dataset/dataset-by-id tenant-conn {:id current-dataset-id})))
               current-where-clause (filter/sql-str (walk/keywordize-keys columns) (:filters current-layer))]
           (map-metadata/build tenant-conn
                               (or raster_table
                                   table-name
                                   (when (not= current-layer-type "raster")
                                     (throw
                                      (ex-info "no authorised to create a map visualisation with current dataset associated" {:datasetId current-dataset-id}))))
                               current-layer current-where-clause opts)))
       layers))

(defn create
  [tenant-conn windshaft-url layers opts]
  (try
    (conform-create-args tenant-conn layers)
    (let [metadata-array (metadata-layers tenant-conn layers opts)
          map-config (map-config/build tenant-conn layers metadata-array)
          headers* (headers tenant-conn)
          layer-group-id (-> (http.client/post* (format "%s/layergroup" windshaft-url)
                                                (merge http-client-req-defaults
                                                       {:body (json/encode map-config)
                                                        :headers headers*
                                                        :content-type :json}))
                             :body json/decode (get "layergroupid"))]
      (lib/ok {:layerGroupId layer-group-id
               :layerMetadata metadata-array}))
    (catch Exception e
      (println e)
      (lib/bad-request (ex-data e)))))
