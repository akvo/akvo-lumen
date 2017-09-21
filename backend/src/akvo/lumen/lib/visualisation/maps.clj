(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]))

;; Localhost to keep within pod?
(def url "http://windshaft:4000/lumen_tenant_1/layergroup")


(defn headers []
  {"x-db-host" "postgres"
   "x-db-port" 5432
   "x-db-user" "lumen"
   "x-db-password" "password"
   "x-db-last-update" (quot (System/currentTimeMillis) 1000)})

(def sql-statement
  "SELECT 'Batman cave' as label, ST_SetSRID(ST_MakePoint(57.74119,12.069034), 4326) AS geom;")

(def map-config
  {"version" "1.6.0"
   "layers" [{"type" "mapnik"
              "options" {"srid" 4326
                         "sql" sql-statement
                         "geom_column" "geom"
                         "cartocss" "#s { marker-width: 10; marker-fill: #e00050;}"
                         "cartocss_version" "2.0.0"
                         "interactivity" "label"}}]})

(defn create []
  (let [resp (client/post url
                          {:body (json/encode map-config)
                           :headers (headers)
                           :content-type :json})]
    (case (:status resp)
      200 (lib/ok (json/decode (:body resp)))
      (prn resp))))


(comment
  (prn (create))

  )
