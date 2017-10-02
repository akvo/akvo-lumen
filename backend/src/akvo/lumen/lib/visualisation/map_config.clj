(ns akvo.lumen.lib.visualisation.map-config)

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
  (format "#s {
               marker-width: %s;
               marker-fill: #6ca429;
               marker-line-color: #888;
               marker-fill-opacity: 0.6;
               marker-allow-overlap: true;
              }"
          (marker-width point-size)))


(defn build [table-name visualisation-spec]
  (clojure.pprint/pprint visualisation-spec)
  (let [layer-spec (first (get-in visualisation-spec ["spec" "layers"]))
        geom-column (get layer-spec "geomColumn")]
    {"version" "1.6.0"
     "layers" [{"type" "mapnik"
                "options" {"cartocss" (cartocss (get layer-spec "pointSize"))
                           "cartocss_version" "2.0.0"
                           "geom_column" geom-column
                           ;; "interactivity" []
                           "sql" (format "select %s from %s" geom-column table-name)
                           "srid" "4326"}}]}))
