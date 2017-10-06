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

(defn point-color-css [point-color-column point-color-mapping]
  ;; #s [ c2 = 'Vaasa' ] { marked-fill: }
  (when point-color-column
    (for [{:strs [value color]} point-color-mapping]
      (format "[ %s = %s ] { marker-fill: %s }"
              point-color-column
              (if (number? value)
                value
                (str "'" value "'"))
              (pr-str color)))))

(defn cartocss [point-size point-color-column point-color-mapping]
  (format "#s {
              marker-allow-overlap: true;
              marker-fill-opacity: 0.6;
              marker-fill: #6ca429;
              marker-line-color: #888;
              marker-width: %s;
            %s }"
          (marker-width point-size)
          (str/join " " (point-color-css point-color-column point-color-mapping))))

(defn trim-css [s]
  (-> s
      str/trim
      (str/replace #"\n" " ")
      (str/replace #" +" " ")))

(defn sql [table-name geom-column popup-columns point-color-column where-clause]
  (format "select %s from %s where %s"
          (str/join ", " (if point-color-column
                           (into popup-columns [geom-column point-color-column])
                           (conj popup-columns geom-column)) )
          table-name
          where-clause))

(defn build [table-name visualisation-spec where-clause metadata]
  (clojure.pprint/pprint visualisation-spec)
  (let [layer-spec (first (get-in visualisation-spec ["spec" "layers"]))
        geom-column (get layer-spec "geom")
        popup-columns (mapv #(get % "column")
                            (get layer-spec "popup"))
        point-color-column (get layer-spec "pointColorColumn")]
    {"version" "1.6.0"
     "layers" [{"type" "mapnik"
                "options" {"cartocss" (trim-css (cartocss (get layer-spec "pointSize")
                                                          (get layer-spec "pointColorColumn")
                                                          (get metadata "pointColorMapping")))
                           "cartocss_version" "2.0.0"
                           "geom_column" geom-column
                           "interactivity" popup-columns
                           "sql" (sql table-name geom-column popup-columns point-color-column where-clause)
                           "srid" "4326"}}]}))
