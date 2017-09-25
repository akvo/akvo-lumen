(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]
            [clojure.string :as s]
            [honeysql.core :as sql]
            [honeysql.helpers :refer [values]]))

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

;;;  Dummy sql start
(def locations
  '({:label "HQ"
     :longitude 4.908075
     :latitude 52.372189}
    {:label "Bat cave"
     :longitude 12.069034
     :latitude 57.74119}))

(defn sql-values [locations]
  (s/join ", "
          (map (fn [{:keys [label longitude latitude]}]
                 (format "('%s', ST_SetSRID(ST_MakePoint(%s,%s), 4326))"
                         label longitude latitude))
               locations)))

(defn sql-statement
  "Dummy data"
  ([]
   "SELECT * FROM (VALUES ('label', ST_SetSRID(ST_MakePoint(4.908075,52.372189), 4326))) AS t (label, geom) LIMIT 0;")
  ([locations]
   (format "SELECT * FROM (VALUES %s ) AS t (label, geom);"
           (sql-values locations))))


;;;  Dummy sql stop

(def cartocss
  "#s { marker-width: 10; marker-fill: #e00050;}")

(defn map-config [cartocss geom-column label sql]
  {"version" "1.6.0"
   "layers" [{"type" "mapnik"
              "options" {"cartocss" cartocss
                         "cartocss_version" "2.0.0"
                         "geom_column" geom-column
                         "interactivity" label
                         "sql" sql
                         "srid" 4326}}]})


(defn create [tenant-conn visualisation-spec]
  ;; Handle dataset if available, yank out relevant ds_<...>,
  ;; geom
  ;; interactivity
  (let [{:keys [db-name headers]} (connection-details tenant-conn)
        akvo-maps-url "http://windshaft:4000"
        url (format "%s/%s/layergroup" akvo-maps-url db-name)
        sql (sql-statement) ;; No dataset
        ;; sql-statement (sql-statement locations)
        ;; sql-statement (sql-statement)
        ;; sql-v (sql)
        ;; _ (prn sql-v)
        resp (client/post url
                          {:body (json/encode (map-config cartocss
                                                          "geom"
                                                          "label"
                                                          sql))
                           :headers headers
                           :content-type :json})]
    (case (:status resp)
      200 (lib/ok (assoc (json/decode (:body resp))
                         "tenantDB" db-name))
      (prn resp))))


(comment

  ;; Playing with Honeysql as a form of AST
  (sql/format {:select [:a :b :c]
               :from [:foo]
               :where [:= :f.a "baz"]})

  ;; "SELECT * FROM (VALUES %s ) AS t (label, geom);"
  (sql/format {:select [:*]
               :from (values [["a" 1] ["b" 2]])
               })




  ;; --

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
