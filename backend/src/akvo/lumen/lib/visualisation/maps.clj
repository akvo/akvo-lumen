(ns akvo.lumen.lib.visualisation.maps
  (:require [akvo.lumen.lib :as lib]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]))

;; Localhost to keep within pod?
(def url "http://windshaft:4000/lumen_tenant_1/layergroup")

(defn headers []
  {"x-db-host" "postgres"
   "x-db-last-update" (quot (System/currentTimeMillis) 1000)
   "x-db-password" "password"
   "x-db-port" 5432
   "x-db-user" "lumen"})

(def sql-statement
  "SELECT 'Batman cave' as label, ST_SetSRID(ST_MakePoint(12.069034,57.74119), 4326) AS geom;")

(def cartocss
  "#s { marker-width: 10; marker-fill: #e00050;}")

(defn map-config [cartocss geom-column label sql-statement]
  {"version" "1.6.0"
   "layers" [{"type" "mapnik"
              "options" {"cartocss" cartocss
                         "cartocss_version" "2.0.0"
                         "geom_column" geom-column
                         "interactivity" label
                         "sql" sql-statement
                         "srid" 4326}}]})

(defn create [db-host visualisation-spec]
  (prn db-host)
  (pprint visualisation-spec)
  ;; Handle if available
  ;; dataset -> yank out relevant ds_<...>,
  ;; geom
  ;; interactivity
  (let [resp (client/post url
                          {:body (json/encode (map-config cartocss
                                                          "geom"
                                                          "label"
                                                          sql-statement))
                           :headers (headers)
                           :content-type :json})]
    (case (:status resp)
      200 (lib/ok (assoc (json/decode (:body resp))
                         "dbHost" db-host))
      (prn resp))))


(comment
  (create)
  )
