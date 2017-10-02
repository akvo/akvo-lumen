(ns akvo.lumen.lib.visualisation.map-config)



(defn build [table-name visualisation-spec]
  (let [layer-spec (first (get-in visualisation-spec ["spec" "layers"]))
        geom-column (get layer-spec "geomColumn")]
    {"version" "1.6.0"
     "layers" [{"type" "mapnik"
                "options" {"cartocss" "#s { marker-width: 8; marker-fill: #6ca429; marker-line-color: #888; marker-fill-opacity: 0.6; marker-allow-overlap: true;}"
                           "cartocss_version" "2.0.0"
                           "geom_column" geom-column
                           ;; "interactivity" []
                           "sql" (format "select %s from %s" geom-column table-name)
                           "srid" "4326"}}]}))
