(ns akvo.lumen.util.maps
  (:require [cheshire.core :as json]
            [garden.core :refer [css]]))

(defn- add-point
  "Returns a PostGIS command to generate a geometry column
  for the given lat/long column pair"
  [lat-col long-col]
  (format "ST_SetSRID(ST_MakePoint(%s, %s), 4326)"
          lat-col long-col))

(defn- cartocss
  "Returns a CartoCSS statement for the given map client attributes"
  [pointColorColumn pointColorMapping pointSize])

(defn- layer
  "Builds a mapConfig layer from the given Lumen mapSpec layer"
  [{:keys [datasetId latitude longitude pointSize pointColorColumn pointColorMapping popup]}]
  (let [geom (add-point latitude longitude)]
    (into {:type "mapnik"}
          {:options {:attributes {}
                     :cartocss "#layer {}"
                     :cartocss_version "2.0.0"
                     :geom_column "geom"
                     :interactivity []
                     :sql (format "select * from %s" datasetId)
                     :srid 4326}})))

(defn mapspec->mapconfig
  "Converts the given map visualisation spec to a Windshaft mapConfig.

  :spec - The Lumen map visualisation spec (JSON)
  :srid - Windshaft SRID (defaults to 4326)"
  [spec & {:keys [srid] :or {srid 4326}}]
  (let [mapconfig {:srid srid :version "1.6.0"}
        {:keys [layers]} (json/parse-string spec true)]
    (into mapconfig {:layers (mapv layer layers)})))



#_(let [data (json/parse-string (slurp "/Users/paul/Downloads/map-spec.json") true)
        {:keys [spec]} (first (:visualisations data))]
    (mapspec->mapconfig (json/generate-string spec)))
