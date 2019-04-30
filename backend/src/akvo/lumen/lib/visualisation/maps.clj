(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.postgres.filter :as filter]
            [akvo.lumen.lib.visualisation.map-config :as map-config]
            [akvo.lumen.lib.visualisation.map-metadata :as map-metadata]
            [akvo.lumen.lib.transformation.engine :as engine]
            [clojure.tools.logging :as log]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.core.match :refer [match]]
            [clojure.walk :as walk]
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

(defn conform-create-args [layers]
  (let [dataset-id (->> layers
                        (filter (fn[layer] (util/valid-dataset-id? (:datasetId layer))))
                        first
                        :datasetId)
        raster-id (->> layers
                       (filter (fn[layer] (util/valid-dataset-id? (:rasterId layer))))
                       first
                       :rasterId)]
    (cond
      (and (not dataset-id) (not raster-id))
      (throw (ex-info "No valid datasetID"
                      {"reason" "No valid datasetID"}))

      (some (fn [layer] (not (valid-location? layer util/valid-column-name?)))
            (filter (fn [layer] (not (= (:layerType layer) "raster"))) layers))
      (throw (ex-info "Location spec not valid"
                      {"reason" "Location spec not valid"}))

      :else [(if (not dataset-id) raster-id dataset-id)])))

(defn create-raster [tenant-conn windshaft-url raster-id]
  (let [{:keys [raster_table metadata]} (raster-by-id tenant-conn {:id raster-id})
        headers* (headers tenant-conn)
        url (format "%s/layergroup" windshaft-url)
        map-config (map-config/build-raster raster_table (:min metadata) (:max metadata))
          _ (log/warn :map-config map-config)
          _ (log/warn :headers headers)
        layer-group-id (-> (client/post url {:body (json/encode map-config)
                                             :headers headers*
                                             :content-type :json})
                           :body json/decode (get "layergroupid"))
        layer-meta (map-metadata/build tenant-conn raster_table {:layerType "raster"} nil)]
    (lib/ok {:layerGroupId layer-group-id
             :layerMetadata layer-meta})))

(defn metadata-layers [tenant-conn layers]
  (map (fn [current-layer]
         (let [current-layer-type (:layerType current-layer)
               current-dataset-id (if (= current-layer-type "raster")
                                    (:rasterId current-layer)
                                    (:datasetId current-layer))
               {:keys [table-name columns raster_table]} (if (= current-layer-type "raster")
                                                           (raster-by-id tenant-conn {:id current-dataset-id})
                                                           (dataset-by-id tenant-conn {:id current-dataset-id}))
               current-where-clause (filter/sql-str (walk/keywordize-keys columns) (:filters current-layer))]
           (map-metadata/build tenant-conn
                               (or raster_table
                                   table-name
                                   (when (not= current-layer-type "raster")
                                     (throw
                                      (ex-info "no authorised to create a map visualisation with current dataset associated" {:datasetId current-dataset-id}))))
                               current-layer current-where-clause)))
       layers))

(defn create
  [tenant-conn windshaft-url layers]
  (try
    (conform-create-args layers)
    (let [metadata-array (metadata-layers tenant-conn layers)
          map-config (map-config/build tenant-conn "todo: remove this" layers metadata-array)
          headers* (headers tenant-conn)
          _ (log/warn :map-config map-config)
          _ (log/warn :headers headers)
          layer-group-id (-> (client/post (format "%s/layergroup" windshaft-url)
                                          {:body (json/encode map-config)
                                           :headers headers*
                                           :content-type :json})
                             :body json/decode (get "layergroupid"))]
      (lib/ok {:layerGroupId layer-group-id
               :layerMetadata metadata-array}))
    (catch Exception e
      (println e)
      (lib/bad-request (ex-data e)))))
