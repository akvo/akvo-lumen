(ns akvo.lumen.lib.visualisation.map-config
  (:require [clojure.string :as str]))

(defn marker-width [point-size]
  (let [point-size (if (string? point-size)
                     (Long/parseLong point-size)
                     point-size)]
    ({1 5
      2 7
      3 9
      4 10
      5 13} point-size 5)))

(defn point-color-css [point-color-column point-color-mapping]
  (when point-color-column
    (for [{:strs [value color]} point-color-mapping]
      (format "[ %s = %s ] { marker-fill: %s }"
              point-color-column
              (if (number? value)
                value
                (format "'%s'" value))
              (pr-str color)))))

(defn cartocss [point-size point-color-column point-color-mapping]
  (format "#s {
              marker-allow-overlap: true;
              marker-fill-opacity: 0.8;
              marker-fill: #6ca429;
              marker-line-color: #fff;
              marker-width: %s;
              %s
           }"
          (marker-width point-size)
          (str/join " " (point-color-css point-color-column point-color-mapping))))

(defn trim-css [s]
  (-> s
      str/trim
      (str/replace #"\n" " ")
      (str/replace #" +" " ")))

(defn sql [columns table-name geom-column popup-columns point-color-column where-clause]
  (let [date-column-set (reduce (fn [m c]
                                  (if (= "date" (get c "type"))
                                    (conj m (get c "columnName"))
                                    m)) #{} columns)
        cols (distinct
              (cond-> (conj (map (fn [c]
                                   (if (contains? date-column-set c)
                                     (str c "::text")
                                     c)) popup-columns) geom-column)
                point-color-column (conj point-color-column)))]
    (format "select %s from %s where %s"
            (str/join ", " cols)
            table-name
            where-clause)))

(defn get-geom-column [layer-spec]
  (if-let [geom (get layer-spec "geom")]
    geom
    (let [{:strs [latitude longitude]} layer-spec]
      (format "ST_SetSRID(ST_MakePoint(%s, %s), 4326) AS latlong" longitude latitude))))

(defn build [table-name layer where-clause metadata columns]
  (let [geom-column (get-geom-column layer)
        popup-columns (mapv #(get % "column")
                            (get layer "popup"))
        point-color-column (get layer "pointColorColumn")]
    {"version" "1.6.0"
     "layers" [{"type" "mapnik"
                "options" {"cartocss" (trim-css (cartocss (get layer "pointSize")
                                                          (get layer "pointColorColumn")
                                                          (get metadata "pointColorMapping")))
                           "cartocss_version" "2.0.0"
                           "geom_column" (or (get layer "geom") "latlong")
                           "interactivity" popup-columns
                           "sql" (sql columns table-name geom-column popup-columns point-color-column
                                      where-clause)
                           "srid" "4326"}}]}))
