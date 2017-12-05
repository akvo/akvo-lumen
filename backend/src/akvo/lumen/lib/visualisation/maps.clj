(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.visualisation.map-config :as map-config]
            [akvo.lumen.lib.visualisation.map-metadata :as map-metadata]
            [akvo.lumen.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.core.match :refer [match]]
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

(defn valid-location? [layer p]
  "Validate map spec layer."
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

(defn conform-create-args [dataset-id layer]
  (cond
    (not (engine/valid-dataset-id? dataset-id))
    (throw (ex-info "No valid datasetID"
                    {"reason" "No valid datasetID"}))

    (not (valid-location? layer engine/valid-column-name?))
    (throw (ex-info "Location spec not valid"
                    {"reason" "Location spec not valid"}))

    :else [dataset-id layer]))

(defn do-create [tenant-conn windshaft-url dataset-id layer]
  (let [{:keys [table-name columns]} (dataset-by-id tenant-conn {:id dataset-id})
        where-clause (filter/sql-str columns (get layer "filters"))
        metadata (map-metadata/build tenant-conn table-name layer where-clause)
        headers (headers tenant-conn)
        url (format "%s/layergroup" windshaft-url)
        map-config (map-config/build table-name layer where-clause metadata columns)
        layer-group-id (-> (client/post url {:body (json/encode map-config)
                                             :headers headers
                                             :content-type :json})
                           :body json/decode (get "layergroupid"))]
    (lib/ok {"layerGroupId" layer-group-id
             "metadata" metadata})))

(defn create-raster [tenant-conn windshaft-url raster-id]
  (let [{:keys [raster_table]} (raster-by-id tenant-conn {:id raster-id})
        headers (headers tenant-conn)
        url (format "%s/layergroup" windshaft-url)
        map-config (map-config/build-raster raster_table)
        layer-group-id (-> (client/post url {:body (json/encode map-config)
                                             :headers headers
                                             :content-type :json})
                           :body json/decode (get "layergroupid"))]
    (lib/ok {"layerGroupId" layer-group-id})))

(defn create
  [tenant-conn windshaft-url dataset-id layer]
  (try
    (let [[dataset-id layer] (conform-create-args dataset-id layer)]
      (do-create tenant-conn windshaft-url dataset-id layer))
    (catch Exception e
      (lib/bad-request (ex-data e)))))
