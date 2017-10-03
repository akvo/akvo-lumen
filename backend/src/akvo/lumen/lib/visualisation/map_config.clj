(ns akvo.lumen.lib.visualisation.map-config
  (:require [clojure.string :as str]))



(defn marker-width [point-size]
  (let [point-size (if (string? point-size)
                     (Long/parseLong point-size)
                     point-size)]
    (get {1 3
          2 4
          3 7
          4 10
          5 13} point-size 8)))

(defn cartocss [point-size]
  (->
   (format "#s {
              marker-allow-overlap: true;
              marker-fill-opacity: 0.6;
              marker-fill: #6ca429;
              marker-line-color: #888;
              marker-width: %s;
            }"
           (marker-width point-size))
   str/trim
   (str/replace #"\n" "")
   (str/replace #" +" " ")))

(defn sql [table-name geom-column popup-columns where-clause]
  (format "select %s from %s where %s"
          (str/join ", " (conj popup-columns geom-column))
          table-name
          where-clause))

(defn build [table-name visualisation-spec where-clause]
  (clojure.pprint/pprint visualisation-spec)
  (let [layer-spec (first (get-in visualisation-spec ["spec" "layers"]))
        geom-column (get layer-spec "geomColumn")
        popup-columns (mapv #(get % "column")
                            (get layer-spec "popup"))]
    {"version" "1.6.0"
     "layers" [{"type" "mapnik"
                "options" {"cartocss" (cartocss (get layer-spec "pointSize"))
                           "cartocss_version" "2.0.0"
                           "geom_column" geom-column
                           "interactivity" popup-columns
                           "sql" (sql table-name geom-column popup-columns where-clause)
                           "srid" "4326"}}]}))
