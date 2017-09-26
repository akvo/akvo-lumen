(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]
            [clojure.string :as s]
            [clojure.string :as str]
            [honeysql.core :as sql]
            [honeysql.helpers :refer [values]]
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
  (let [db-url (.getJdbcUrl (:datasource tenant-conn))
        db-uri (java.net.URI. (subs db-url 5))
        db-name (subs (.getPath db-uri) 1)]
    {:headers (headers db-uri)
     :db-name db-name}))

(defn- no-dataset-sql
  "SQL to use when there is no dataset in the visualisation spec."
  []
  "SELECT * FROM (VALUES ('label', ST_SetSRID(ST_MakePoint(4.908075,52.372189), 4326))) AS t (label, geom) LIMIT 0;")

(defn- compile-sql
  "Takes table geom-column & label-column strings and returns a SQL string."
  [table geom-column label-column]
  (let [[prepared-statement & args] (sql/format {:select [[geom-column "geom"]
                                                          [label-column "label"]]
                                                 :from [table]})
        fmt-string (str/replace prepared-statement #"\?" "%s")]
    (apply (partial format fmt-string) args)))

(def cartocss
  "#s { marker-width: 10; marker-fill: #e00050;}")

(defn map-config
  [cartocss geom-column label-column sql]
  {"version" "1.6.0"
   "layers" [{"type" "mapnik"
              "options" {"cartocss" cartocss
                         "cartocss_version" "2.0.0"
                         "geom_column" geom-column
                         "interactivity" [label-column]
                         "sql" sql
                         "srid" 4326}}]})

(defn create
  "Takes a tenant connection and a visualisation spec. Will get a layergroupid
  from Windshaft and compose a response with the db-name attached under the key
  tenantDB."
  [tenant-conn visualisation-spec]
  (prn "\n\n-------------------------------------------------------------------")
  (prn "@maps/create")
  (clojure.pprint/pprint visualisation-spec)
  (try
    (let [{:keys [db-name headers]} (connection-details tenant-conn)
          akvo-maps-url "http://windshaft:4000" ;; localhost in production
          url (format "%s/%s/layergroup" akvo-maps-url db-name)
          dataset-id (get visualisation-spec "datasetId")
          geom-column "d1"
          label-column "c2"
          sql (if (nil? dataset-id)
                (no-dataset-sql)
                (let [dataset (dataset-by-id tenant-conn {:id dataset-id})
                      table (:table-name dataset)]
                  (compile-sql table geom-column label-column)))
          _ (prn sql)
          map-config (map-config cartocss "geom" "label" sql)
          windshaft-resp (client/post url
                                      {:body (json/encode map-config)
                                       :headers headers
                                       :content-type :json})]
      (lib/ok (assoc (json/decode (:body windshaft-resp))
                     "tenantDB" db-name)))
    (catch Exception e
      (prn (ex-data e)))))




(comment

  (sql/format {:select [:a :b :c]
               :from [:foo]
               :where [:= :f.a "baz"]})

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
