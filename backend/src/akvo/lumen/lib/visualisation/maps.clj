(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.postgres.filter :as filter]
            [akvo.lumen.lib.visualisation.map-config :as map-config]
            [akvo.lumen.lib.visualisation.map-metadata :as map-metadata]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.core.match :refer [match]]
            [clojure.walk :refer (keywordize-keys)]
            [hugsql.core :as hugsql])
  (:import [com.zaxxer.hikari HikariDataSource]
           [java.net URI]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/raster.sql")

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

(defn valid-location?
  "Validate map spec layer."
  [layer p]
  (let [m (into {} (remove (comp nil? val)
                           (select-keys layer ["geom" "latitude" "longitude"])))]
    (match [m]
           [({"geom" geom} :only ["geom"])] (p geom)

           [({"geom" geom "latitude" latitude} :only ["geom" "latitude"])]
           (check-columns p geom latitude)

           [({"geom" geom "longitude" longitude} :only ["geom" "longitude"])]
           (check-columns p geom longitude)

           [({"latitude" latitude "longitude" longitude}
             :only ["latitude" "longitude"])]
           (check-columns p latitude longitude)

           [{"geom" geom "latitude" latitude "longitude" longitude}]
           (check-columns p geom latitude longitude)

           :else false)))

(defn conform-create-args [layers]
  (let [dataset-id (get (first (filter (fn[layer] (util/valid-dataset-id? (get layer "datasetId"))) layers)) "datasetId")
        raster-id (get (first (filter (fn[layer] (util/valid-dataset-id? (get layer "rasterId"))) layers)) "rasterId")]
    (cond
      (and (not dataset-id) (not raster-id))
      (throw (ex-info "No valid datasetID"
                      {"reason" "No valid datasetID"}))

      (some (fn [layer] (not (valid-location? layer util/valid-column-name?))) (filter (fn [layer] (not (= (get layer "layerType") "raster"))) layers))
      (throw (ex-info "Location spec not valid"
                      {"reason" "Location spec not valid"}))

      :else [(if (not dataset-id) raster-id dataset-id)])))

(defn do-create [tenant-conn windshaft-url dataset-id layers]
  (let [metadata-array (map (fn [current-layer]
                              (let [current-layer-type (get current-layer "layerType")
                                    current-dataset-id (if (= current-layer-type "raster")
                                                         (get current-layer "rasterId")
                                                         (get current-layer "datasetId"))
                                    {:keys [table-name columns raster_table]} (if (= current-layer-type "raster")
                                                                                (raster-by-id tenant-conn {:id current-dataset-id})
                                                                                (dataset-by-id tenant-conn {:id current-dataset-id}))
                                    current-where-clause (filter/sql-str (keywordize-keys columns) (get current-layer "filters"))]
                                (map-metadata/build tenant-conn (or raster_table table-name) current-layer current-where-clause)))
                            layers)
        headers (headers tenant-conn)
        url (format "%s/layergroup" windshaft-url)
        map-config (map-config/build tenant-conn "todo: remove this" layers metadata-array)
        layer-group-id (-> (client/post url {:body (json/encode map-config)
                                             :headers headers
                                             :content-type :json})
                           :body json/decode (get "layergroupid"))]
    (lib/ok {"layerGroupId" layer-group-id
             "layerMetadata" metadata-array})))

(defn create-raster [tenant-conn windshaft-url raster-id]
  (let [{:keys [raster_table metadata]} (raster-by-id tenant-conn {:id raster-id})
        headers (headers tenant-conn)
        url (format "%s/layergroup" windshaft-url)
        map-config (map-config/build-raster raster_table (:min metadata) (:max metadata))
        layer-group-id (-> (client/post url {:body (json/encode map-config)
                                             :headers headers
                                             :content-type :json})
                           :body json/decode (get "layergroupid"))
        layer-meta (map-metadata/build tenant-conn raster_table {"layerType" "raster"} nil)]
    (lib/ok {"layerGroupId" layer-group-id
             "layerMetadata" layer-meta})))

(defn create
  [tenant-conn windshaft-url layers]
  (try
    (let [[dataset-id] (conform-create-args layers)]
      (do-create tenant-conn windshaft-url dataset-id layers))
    (catch Exception e
      (println e)
      (lib/bad-request (ex-data e)))))
