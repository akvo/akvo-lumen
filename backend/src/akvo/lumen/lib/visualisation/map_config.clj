(ns akvo.lumen.lib.visualisation.map-config
  (:require [clojure.string :as str]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn layer-point-color [layer-index]
    ({0 "#2ca409"
      1 "#096ba4"
      2 "#7a09a4"
      3 "#a4092a"
      4 "#fff721" } layer-index))

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
              (if (string? value)
                (format "'%s'" value)
                value)
              (pr-str color)))))

(defn point-cartocss [point-size point-color-column point-color-mapping layer-index]
  (format "#s {
              marker-allow-overlap: true;
              marker-fill-opacity: 0.8;
              marker-fill: %s;
              marker-line-color: #fff;
              marker-width: %s;
              %s
           }"
          (layer-point-color layer-index)
          (marker-width point-size)
          (str/join " " (point-color-css point-color-column point-color-mapping))))

(defn shape-cartocss [layer-index]
  (format "#s {
              polygon-opacity: 0.8;
              polygon-fill: transparent;
              line-width: 2;
              line-color: rgba(0,0,0,0.3);
           }
           "
          (layer-point-color layer-index)))

(defn shape-aggregation-cartocss [layer-index]
  (format "#s {
              polygon-opacity: 0.8;
              polygon-fill: [shapefill];
              line-width: 0.5;
              line-color: rgba(0,0,0,0.3);
           }
           #s::labels {
            text-name: [aggregation];
            text-face-name: 'DejaVu Sans Book';
            text-size: 10;
            text-fill: #000;
           }
           "
          (layer-point-color layer-index)))

(defn cartocss [layer layer-index metadata-array]
  (cond
    (and (get layer "aggregationDataset")(get layer "aggregationColumn")(get layer "aggregationGeomColumn"))
    (shape-aggregation-cartocss layer-index)

    (= (get layer "layerType") "geo-shape")
    (shape-cartocss layer-index)

    :else
    (point-cartocss (get layer :pointSize) (get layer :pointColorColumn) (get (nth metadata-array layer-index) :pointColorMapping) layer-index)
  )
)

(defn trim-css [s]
  (-> s
      str/trim
      (str/replace #"\n" " ")
      (str/replace #" +" " ")))

(defn shape-aggregation-sql [columns table-name geom-column popup-columns point-color-column where-clause current-layer tenant-conn]
  (let [
    {:keys [table-name columns]} (dataset-by-id tenant-conn {:id (get current-layer "aggregationDataset")})
    point-table-name table-name
    point-columns columns
    {:keys [table-name columns]} (dataset-by-id tenant-conn {:id (get current-layer "datasetId")})
    shape-table-name table-name
    shape-columns columns
    aggregation-method (get current-layer "aggregationMethod" "avg")
    date-column-set (reduce (fn [m c]
                                  (if (= "date" (get c "type"))
                                    (conj m (get c "columnName"))
                                    m)) #{} point-columns)
        cols (distinct
              (cond-> (conj (map (fn [c]
                                   (if (contains? date-column-set c)
                                     (str c "::text")
                                     c)) popup-columns) geom-column)
                point-color-column (conj point-color-column)))]

    (format "with temp_table as
              (select
                  %s.%s,
                  %s(pointTable.%s::decimal) AS aggregation
                from %s
                left join (select * from %s)pointTable on
                st_contains(%s.%s, pointTable.%s)
                GROUP BY %s.%s)
            select
              %s,
              aggregation,
              CASE WHEN aggregation IS NULL THEN
                  'grey'
                ELSE
                  concat(
                    'rgb(255,',
                    255 - floor(
                      (
                        (aggregation::decimal - (select min(aggregation) from temp_table)::decimal) /
                        ((select max(aggregation) from temp_table)::decimal - (select min(aggregation) from temp_table)::decimal)
                      ) * 255
                    ),
                    ',',
                    255 - floor(
                      (
                        (aggregation::decimal - (select min(aggregation) from temp_table)::decimal) /
                        ((select max(aggregation) from temp_table)::decimal - (select min(aggregation) from temp_table)::decimal)
                      ) * 255
                    ),
                    ')'
                  )
              END as shapefill
            from
              temp_table;
            "
            shape-table-name
            (get current-layer "geom")
            aggregation-method
            (get current-layer "aggregationColumn")
            shape-table-name
            point-table-name
            shape-table-name
            (get current-layer "geom")
            (get current-layer "aggregationGeomColumn")
            shape-table-name
            (get current-layer "geom")
            (get current-layer "geom")
            )))

(defn point-sql [columns table-name geom-column popup-columns point-color-column where-clause current-layer tenant-conn]
  (let [
    {:keys [table-name columns]} (dataset-by-id tenant-conn {:id (get current-layer "datasetId")})
    date-column-set (reduce (fn [m c]
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

(defn shape-sql [columns table-name geom-column popup-columns point-color-column where-clause current-layer tenant-conn]
  (let [{:keys [table-name columns]} (dataset-by-id tenant-conn {:id (get current-layer "datasetId")})]
    (if (and ((boolean (get-in current-layer "aggregationDataset"))) ((boolean (get-in current-layer "aggregationColumn"))) ((boolean (get-in current-layer "aggregationGeomColumn"))) )

    (shape-aggregation-sql [columns table-name geom-column popup-columns point-color-column where-clause current-layer tenant-conn])

        (format "select %s from %s"
              (get current-layer "geom")
              table-name
              )
  )))

(defn get-sql [columns table-name geom-column popup-columns point-color-column where-clause layer tenant-conn]

  (cond
    (and (get layer "aggregationDataset")(get layer "aggregationColumn")(get layer "aggregationGeomColumn"))
    (shape-aggregation-sql columns table-name geom-column popup-columns point-color-column where-clause layer tenant-conn)

    (= (get layer "layerType") "geo-shape")
    (point-sql columns table-name geom-column popup-columns point-color-column where-clause layer tenant-conn)

    :else
    (point-sql columns table-name geom-column popup-columns point-color-column where-clause layer tenant-conn)
  )
)

(defn get-geom-column [layer-spec]
  (if-let [geom (get layer-spec "geom")]
    geom
    (let [{:strs [latitude longitude]} layer-spec]
      (format "ST_SetSRID(ST_MakePoint(%s, %s), 4326) AS latlong" longitude latitude))))

(defn get-layers [layers metadata-array table-name conn]
  (map-indexed (fn [idx, current-layer]
                (let [geom-column (get-geom-column current-layer)
                      {:keys [columns]} (dataset-by-id conn {:id (get current-layer "datasetId")})
                      where-clause (filter/sql-str columns (get current-layer "filters"))
                      popup-columns (mapv #(get % "column")
                                         (get current-layer "popup"))
                     point-color-column (get current-layer "pointColorColumn")]
                { "type" "mapnik"
                  "options" {
                    "cartocss" (trim-css (cartocss current-layer idx metadata-array))
                    "cartocss_version" "2.0.0"
                    "geom_column" (or (get current-layer "geom") "latlong")
                    "interactivity" popup-columns
                    "sql" (get-sql columns table-name geom-column popup-columns point-color-column where-clause current-layer conn)
                    "srid" "4326"
                  }})) layers))

(defn build [table-name layers metadata-array tenant-conn]
  {"version" "1.6.0"
   "buffersize" {
    "png" 8
    "grid.json" 8
    "mvt" 0
   }
   "layers" (get-layers layers metadata-array table-name tenant-conn)})
