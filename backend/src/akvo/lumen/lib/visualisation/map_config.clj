(ns akvo.lumen.lib.visualisation.map-config
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [honeysql.core :as sql]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn marker-width [point-size]
  (get {"1" 4
        "2" 8
        "3" 12
        "4" 18
        "5" 24} point-size 1))

(defn cartocss
  ([]
   (cartocss 1))
  ([point-size]
   (format "#s { marker-width: %s; marker-fill: #6ca429; marker-line-color: #888; marker-fill-opacity: 0.6; marker-allow-overlap: true;}
  " (marker-width point-size))))

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

#_(defn point-colors
    [tenant-conn table-name pointColorColumn]
    (prn tenant-conn)
    (prn table-name)
    (prn pointColorColumn)
    (jdbc/query tenant-conn (sql/format {:select [[pointColorColumn "options"]
                                                  [:%count.* "n"]]
                                         :from [table-name]
                                         :group-by [pointColorColumn]
                                         :limit 5})))

(defn map-config-layer
  [tenant-conn {:strs [datasetId popup pointSize pointColorColumn]}]
  (let [dataset (dataset-by-id tenant-conn {:id datasetId})
        table-name (:table-name dataset)
        geom-column "d1"
        ;; point-options (point-colors tenant-conn table-name pointColorColumn)
        ;; _ (prn point-options)
        ]
    {"type" "mapnik"
     "options" {"cartocss" (cartocss pointSize)
                "cartocss_version" "2.0.1"
                "geom_column" "geom"
                "label" "geom"
                "interactivity" (-> (map vals popup) flatten vec)
                "sql" (compile-sql table-name geom-column popup)
                "srid" 4326}}))

(def no-dataset-map-config
  {"version" "1.6.0"
   "layers" [{"type" "mapnik"
              "options" {"cartocss" (cartocss)
                         "cartocss_version" "2.0.0"
                         "geom_column" "geom"
                         "interactivity" "label"
                         "sql" no-dataset-sql
                         "srid" "4326"}}]})


(defn build [tenant-conn visualisation-spec]
  (clojure.pprint/pprint visualisation-spec)
  (if (nil? (get visualisation-spec "datasetId"))
    no-dataset-map-config
    (assoc {"version" "1.6.0"}
           "layers" (into [] (map (partial map-config-layer tenant-conn)
                                  (get-in visualisation-spec ["spec" "layers"]))))))
