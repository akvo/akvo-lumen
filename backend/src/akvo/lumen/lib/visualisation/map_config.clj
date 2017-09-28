(ns akvo.lumen.lib.visualisation.map-config
  (:require [clojure.string :as str]
            [honeysql.core :as sql]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

#_(def cartocss
    "#s { marker-width: 8; marker-fill: #6ca429; marker-line-color: #888; marker-fill-opacity: 0.6; marker-allow-overlap: true;}
  #s[label2='Daniel']{marker-fill: #FFA500;}
  ")

(def cartocss
  "#s { marker-width: 8; marker-fill: #6ca429; marker-line-color: #888; marker-fill-opacity: 0.6; marker-allow-overlap: true;}
  ")

(def no-dataset-sql
  "SELECT * FROM (VALUES ('label', ST_SetSRID(ST_MakePoint(4.908075,52.372189), 4326))) AS t (label, geom) LIMIT 0;")

(defn compile-sql
  [table geom-column popups]
  (let [geom-spec [geom-column "geom"]

        selects (vec (map #(let [[alias column] (first %)]
                             [column alias])
                          popups))
        [prepared-statement & args] (sql/format {:select (conj selects geom-spec)
                                                 :from [table]})
        fmt-string (str/replace prepared-statement #"\?" "%s")]
    (apply (partial format fmt-string) args)))

(defn map-config-layer
  [tenant-conn {:strs [datasetId popup]}]
  (let [dataset (dataset-by-id tenant-conn {:id datasetId})
        table-name (:table-name dataset)
        geom-column "d1"]
    {"type" "mapnik"
     "options" {"cartocss" cartocss
                "cartocss_version" "2.0.1"
                "geom_column" "geom"
                "label" "geom"
                "interactivity" (-> (map vals popup) flatten vec)
                "sql" (compile-sql table-name geom-column popup)
                "srid" 4326}}))

(def no-dataset-map-config
  {"version" "1.6.0"
   "layers" [{"type" "mapnik"
              "options" {"cartocss" cartocss
                         "cartocss_version" "2.0.0"
                         "geom_column" "geom"
                         "interactivity" "label"
                         "sql" no-dataset-sql
                         "srid" "4326"}}]})

(defn build [tenant-conn visualisation-spec]
  (if (nil? (get visualisation-spec "datasetId"))
    no-dataset-map-config
    (assoc {"version" "1.6.0"}
           "layers" (into [] (map (partial map-config-layer tenant-conn)
                                  (get-in visualisation-spec ["spec" "layers"]))))))
