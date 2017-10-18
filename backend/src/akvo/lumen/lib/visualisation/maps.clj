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

(defn do-create [tenant-conn windshaft-url dataset-id layer]
  (let [{:keys [table-name columns]} (dataset-by-id tenant-conn {:id dataset-id})
        where-clause (filter/sql-str columns (get layer "filters"))
        metadata (map-metadata/build tenant-conn table-name layer where-clause)
        {:keys [db-name headers]} (connection-details tenant-conn)
        url (format "%s/%s/layergroup" windshaft-url db-name)
        map-config (map-config/build table-name layer where-clause metadata)
        layer-group-id (-> (client/post url {:body (json/encode map-config)
                                             :headers headers
                                             :content-type :json})
                           :body json/decode (get "layergroupid"))]
    (lib/ok {"layerGroupId" layer-group-id
             "metadata" metadata
             "tenantDB" db-name})))




(defn valid-location? [layer p]
  true)

(defn conform-create-args [dataset-id layer]
  (cond
    (not (engine/valid-dataset-id? dataset-id))
    (throw (ex-info "No valid datasetID"
                    {"reason" "No valid datasetID"}))

    (not (valid-location? layer engine/valid-column-name?))
    (throw (ex-info "Location spec not valid"
                    {"reason" "Location spec not valid"}))

    :else [dataset-id layer]))

(defn create
  [tenant-conn windshaft-url dataset-id layer]
  (try
    (let [[dataset-id layer] (conform-create-args dataset-id layer)]
      (do-create tenant-conn windshaft-url dataset-id layer))
    (catch Exception e
      (lib/bad-request (ex-data e)))))


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
