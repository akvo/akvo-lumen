(ns akvo.lumen.lib.visualisation.map-config
  (:require [akvo.lumen.lib.aggregation.filter :as filter]
            [clojure.string :as str]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn layer-point-color [layer-index]
  ({0 "#2ca409"
    1 "#096ba4"
    2 "#7a09a4"
    3 "#a4092a"
    4 "#fff721"} layer-index "#000000"))

(defn marker-width [point-size]
  (let [point-size (if (string? point-size)
                     (Long/parseLong point-size)
                     point-size)]
    ({1 2
      2 4
      3 6
      4 8
      5 10} point-size 4)))

(defn point-color-css [point-color-column point-color-mapping]
  (when point-color-column
    (for [{:strs [value color]} point-color-mapping]
      (format "[ %s = %s ] { marker-fill: %s }"
              point-color-column
              (if (string? value)
                (format "'%s'" value)
                value)
              (pr-str color)))))

(defn point-cartocss
  [point-size point-color-column point-color-mapping layer-index]
  (let [s-template "
#s {
    marker-allow-overlap: true;
    marker-fill-opacity: 0.8;
    marker-fill: %s;
    marker-line-color: #fff;
    marker-width: %s;
    %s
}\n"]
    (format s-template
            (layer-point-color layer-index)
            (marker-width point-size)
            (str/join " "
                      (point-color-css point-color-column point-color-mapping)))))

(defn shape-cartocss [layer-index {:strs [shapeLabelColumn] :as layer}]
  (let [s-template "
#s {
    polygon-opacity: 0.8;
    polygon-fill: transparent;
    line-width: 2;
    line-color: rgba(0,0,0,0.3);
}\n"
        labels-template "
#s::labels {
    text-name: [%s];
    text-face-name: 'DejaVu Sans Book';
    text-size: 10;
    text-fill: #000;
}\n"]
    (cond-> (format s-template (layer-point-color layer-index))
      shapeLabelColumn (str (format labels-template shapeLabelColumn)))))

(defn shape-aggregation-cartocss [layer-index {:strs [shapeLabelColumn]}]
  (let [s-template "
#s {
    polygon-opacity: 0.8;
    polygon-fill: [shapefill];
    line-width: 0.5;
    line-color: rgba(0,0,0,0.3);
}\n"
        labels-template "
#s::labels {
    text-name: [%s];
    text-face-name: 'DejaVu Sans Book';
    text-size: 10;
    text-fill: #000;
}\n"]
    (cond-> (format s-template (layer-point-color layer-index))
      shapeLabelColumn
      (str (format labels-template shapeLabelColumn)))))

(defn cartocss
  [{:strs [aggregationColumn aggregationDataset aggregationGeomColumn
           layerType pointColorColumn pointSize] :as layer}
   layer-index metadata-array]
  (cond
    (and aggregationColumn
         aggregationDataset
         aggregationGeomColumn) (shape-aggregation-cartocss layer-index layer)

    (= layerType "geo-shape") (shape-cartocss layer-index layer)

    :else (point-cartocss pointSize
                          pointColorColumn
                          (get (nth metadata-array layer-index)
                               "pointColorMapping")
                          layer-index)))

(defn trim-css [s]
  (-> s
      str/trim
      (str/replace #"\n" " ")
      (str/replace #" +" " ")))

;; Should convert hex string to hue for hsl color. Use string matching as proof of concept for now
(defn color-to-hue [s]
  (case s
    "#FF0000" "0"
    "#00FF00" "120"
    "#0000FF" "240"))

(defn shape-aggregagation-extra-cols-sql [popup table-name prefix postfix]
  (if (= (count popup) 0)
    ""
    (str prefix
         (clojure.string/join "," (map (fn [{:strs [column]}]
                                         (str table-name "." column))
                                       popup))
         postfix)))

(defn popup-and-label-cols [popup-cols label-col]
  (cond
    (and (boolean popup-cols)
         (boolean label-col)) (distinct (conj popup-cols {"column" label-col}))

    (boolean popup-cols) popup-cols

    (boolean label-col) [{"column" label-col}]

    :else []))

(defn shape-aggregation-sql
  [tenant-conn columns table-name geom-column popup-columns point-color-column where-clause current-layer layer-index]
  (let [{:keys [table-name columns]} (dataset-by-id tenant-conn {:id (get current-layer "aggregationDataset")})
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
                point-color-column (conj point-color-column)))
        hue (color-to-hue (clojure.string/upper-case (get current-layer "gradientColor" "#FF0000")))
        extra-cols (popup-and-label-cols (get current-layer "popup") (get current-layer "shapeLabelColumn"))]

    (format "
            SELECT
              %s
              _aggregation,
              shapefill,
              %s.%s
            FROM
              (
                with temp_table as
                  (select
                      %s
                      %s.rnum AS shapeRowNum,
                      %s(pointTable.%s::decimal) AS aggregation
                    from %s
                    left join (select * from %s)pointTable on
                    st_contains(%s.%s, pointTable.%s)
                    GROUP BY %s.rnum %s)
                select
                  %s
                  shapeRowNum,
                  aggregation as _aggregation,
                  CASE WHEN aggregation IS NULL THEN
                      'grey'
                    ELSE
                      concat(
                        'hsl(%s, 75%%, ',
                        100 - floor(
                          CASE
                            WHEN (select max(aggregation) from temp_table)::decimal=(select min(aggregation) from temp_table)::decimal THEN 50
                            ELSE
                              (
                                (aggregation::decimal - (select min(aggregation) from temp_table)::decimal) /
                                ((select max(aggregation) from temp_table)::decimal - (select min(aggregation) from temp_table)::decimal)
                              ) * 50
                          END
                        ),
                        '%%)'
                      )
                  END as shapefill
                from
                  temp_table
              )row_query
            LEFT JOIN
              %s
            ON
              row_query.shapeRowNum = %s.rnum
            ;
            "

            (shape-aggregagation-extra-cols-sql extra-cols "row_query" "" ",")
            shape-table-name
            (get current-layer "geom")
            (shape-aggregagation-extra-cols-sql extra-cols shape-table-name "" ",")
            shape-table-name
            aggregation-method
            (get current-layer "aggregationColumn")
            shape-table-name
            point-table-name
            shape-table-name
            (get current-layer "geom")
            (get current-layer "aggregationGeomColumn")
            shape-table-name
            (shape-aggregagation-extra-cols-sql extra-cols shape-table-name "," "")
            (shape-aggregagation-extra-cols-sql extra-cols "temp_table" "" ",")
            hue
            shape-table-name
            shape-table-name)))

(defn point-sql [tenant-conn columns table-name geom-column popup-columns
                 point-color-column where-clause {:strs [datasetId] :as layer}]
  (let [{:keys [table-name columns]} (dataset-by-id tenant-conn {:id datasetId})
        date-column-set (reduce (fn [m {:strs [columnName type]}]
                                  (if (= "date" type) (conj m columnName) m))
                                #{} columns)
        cols (distinct
              (cond-> (conj (map (fn [c]
                                   (if (contains? date-column-set c)
                                     (str c "::text")
                                     c))
                                 popup-columns)
                            geom-column)
                point-color-column (conj point-color-column)))]
    (format "select %s from %s where %s"
            (str/join ", " cols)
            table-name
            where-clause)))

(defn shape-sql [tenant-conn columns table-name geom-column popup-columns point-color-column where-clause
                 {:strs [datasetId shapeLabelColumn ] :as layer}]
  (let [{:keys [table-name columns]} (dataset-by-id tenant-conn {:id datasetId})
        date-column-set (reduce (fn [m {:strs [columnName type]}]
                                  (if (= "date" type) (conj m columnName) m))
                                #{} columns)
        cols (distinct
              (cond-> (conj (map (fn [c]
                                   (if (contains? date-column-set c)
                                     (str c "::text")
                                     c))
                                 popup-columns)
                            geom-column)
                point-color-column (conj point-color-column)
                shapeLabelColumn (conj shapeLabelColumn)))]
    (format "select %s from %s where %s"
            (str/join ", " cols)
            table-name
            where-clause)))

(defn get-sql
  [tenant-conn columns table-name geom-column popup-columns point-color-column
   where-clause {:strs [aggregationDataset aggregationColumn
                        aggregationGeomColumn layerType]
                 :as layer} layer-index]
  (cond
    (and aggregationDataset aggregationColumn aggregationGeomColumn)
    (shape-aggregation-sql tenant-conn columns table-name geom-column
                           popup-columns point-color-column where-clause layer
                           layer-index)

    (= layerType "geo-shape")
    (shape-sql tenant-conn columns table-name geom-column popup-columns
               point-color-column where-clause layer)

    :else
    (point-sql tenant-conn columns table-name geom-column popup-columns
               point-color-column where-clause layer)))

(defn get-interactivity
  [{:strs [aggregationDataset aggregationColumn aggregationGeomColumn] :as layer}
   popup-columns]
  (if (and aggregationDataset aggregationColumn aggregationGeomColumn)
    (into ["_aggregation"] popup-columns)
    popup-columns))

(defn get-geom-column [layer-spec]
  (if-let [geom (get layer-spec "geom")]
    geom
    (let [{:strs [latitude longitude]} layer-spec]
      (format "ST_SetSRID(ST_MakePoint(%s, %s), 4326) AS latlong"
              longitude latitude))))

(defn get-layers [tenant-conn layers metadata-array table-name]
  (map-indexed (fn [idx {:strs [datasetId filters geom popup pointColorColumn]
                         :as layer}]
                 (let [geom-column (get-geom-column layer)
                       {:keys [columns]} (dataset-by-id tenant-conn {:id datasetId})
                       where-clause (filter/sql-str columns filters)
                       popup-columns (mapv #(get % "column") popup)
                       point-color-column pointColorColumn
                       sql (get-sql tenant-conn columns table-name geom-column
                                    popup-columns point-color-column
                                    where-clause layer idx)]
                   #_(prn (get-sql columns table-name geom-column popup-columns point-color-column where-clause layer idx conn))
                   {"type" "mapnik"
                    "options" {"cartocss" (trim-css (cartocss layer idx metadata-array))
                               "cartocss_version" "2.0.0"
                               "geom_column" (or geom "latlong")
                               "interactivity" (get-interactivity layer popup-columns)
                               "sql" sql
                               "srid" "4326"}}))
               layers))

(defn build [tenant-conn table-name layers metadata-array]
  {"version" "1.6.0"
   "buffersize" {"png" 8
                 "grid.json" 0
                 "mvt" 0}
   "layers" (get-layers tenant-conn layers metadata-array table-name)})
