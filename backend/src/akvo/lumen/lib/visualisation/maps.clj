(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.visualisation.map-config :as map-config]
            [akvo.lumen.lib.visualisation.map-metadata :as map-metadata]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn- headers [uri]
  (let [{:keys [password user]} (util/query-map (.getQuery uri))
        port (let [p (.getPort uri)]
               (if (pos? p) p 5432))]
    {"x-db-host" (.getHost uri)
     "x-db-last-update" (quot (System/currentTimeMillis) 1000)
     "x-db-password" password
     "x-db-port" port
     "x-db-user" user}))

(defn- connection-details [tenant-conn]
  (let [db-uri (java.net.URI. (subs (-> tenant-conn :datasource .getJdbcUrl) 5))
        db-name (subs (.getPath db-uri) 1)]
    {:db-name db-name
     :headers (headers db-uri)}))

(defn create
  "Takes a tenant connection, a windshaft url and a visualisation spec. Will get
  a layergroupid from Windshaft and compose a response with the db-name attached
  under the key tenantDB."
  [tenant-conn windshaft-url {:strs [datasetId] :as visualisation-spec}]
  (if (nil? datasetId)
    (lib/bad-request {"reason" "No datasetID"})
    (let [map-spec (assoc-in visualisation-spec ["spec" "layers" 0 "geomColumn"]
                             "d1")
          {:keys [db-name headers]} (connection-details tenant-conn)
          url (format "%s/%s/layergroup" windshaft-url db-name)
          {:keys [columns table-name]} (dataset-by-id tenant-conn {:id datasetId})
          metadata (map-metadata/build tenant-conn columns table-name map-spec)
          config (map-config/build table-name map-spec)
          windshaft-resp (client/post url {:body (json/encode config)
                                           :headers headers
                                           :content-type :json})
          layer-group-id (-> windshaft-resp
                             :body
                             json/decode
                             (get "layergroupid"))]
      (lib/ok {"layerGroupId" layer-group-id
               "metadata" metadata
               "tenantDB" db-name}))))

(comment

  ;; Example map spec
  {"type" "visualisation",
   "name" "Untitled visualisation",
   "visualisationType" "map",
   "datasetId" "59c3ab16-34e8-44df-957e-6c1c38fbf465",
   "spec"
   {"version" 1,
    "baseLayer" "street",
    "layers"
    [{"popup" [{"column" "c4"}],
      "longitude" "c7",
      "pointSize" 1,
      "legend" {"title" "City", "visible" true, "position" "bottom"},
      "filters" [],
      "latitude" "c6",
      "visible" true,
      "pointColorMapping"
      [{"op" "equals", "value" "Finland", "color" "#86AA90"}
       {"op" "equals", "value" "Gothenburg", "color" "#BF2932"}
       {"op" "equals", "value" "London", "color" "#19A99D"}
       {"op" "equals", "value" "Netherlands", "color" "#66608F"}
       {"op" "equals", "value" "Vaasa", "color" "#95734B"}],
      "pointColorColumn" "c5",
      "datasetId" "59c3ab16-34e8-44df-957e-6c1c38fbf465",
      "title" "Untitled Layer 1"}]}}

  )
