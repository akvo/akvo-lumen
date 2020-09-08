(ns akvo.lumen.lib.visualisation.map-metadata
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.aggregation.commons :refer (sql-option-bucket-column)]
            [clojure.walk :as walk]
            [clojure.string :as str]))

(def palette ["#BF2932"
              "#19A99D"
              "#95734B"
              "#86AA90"
              "#66608F"
              "#FEDA77"
              "#C0652A"
              "#5286B4"
              "#C28A6F"
              "#61B66F"
              "#3D3455"
              "#D8BB7F"
              "#158EAE"
              "#5F6253"
              "#921FA1"
              "#F38341"
              "#487081"
              "#556123"
              "#C799AE"
              "#2F4E77"
              "#B8385E"
              "#9E4962"])

(def gradient-palette ["#FF0000"
              "#00FF00"
              "#0000FF"])

(defn next-point-color [used-colors]
  (or (some (fn [color] (if (contains? used-colors color) false color)) palette) "#000000"))

(defn move-last
  "Move the first element in coll last. Returns a vector"
  [coll]
  (if (empty? coll)
    coll
    (let [[first & rest] coll]
      (conj (vec rest) first))))

(defn sort-point-color-mapping
  [point-color-mapping]
  (let [sorted (sort-by :value point-color-mapping)]
    (if (nil? (-> sorted first :value))
      (move-last sorted)
      sorted)))

(defn point-color-mapping
  [tenant-conn table-name {:keys [pointColorMapping pointColorColumn]} where-clause columns]
  (when pointColorColumn
    (let [pointColorColumn (first (filter #(= (:columnName %) pointColorColumn) columns))
          sql-str (format "SELECT distinct %s AS value FROM %s WHERE %s LIMIT 22"
                          (sql-option-bucket-column pointColorColumn) table-name where-clause)
          distinct-values (map :value
                               (jdbc/query tenant-conn sql-str))
          used-colors (set (map :color pointColorMapping))
          color-map (reduce (fn [m {:keys [value color]}]
                              (assoc m value color))
                            {}
                            pointColorMapping)
          color-mapping (loop [result []
                               values distinct-values
                               used-colors used-colors]
                          (if (empty? values)
                            result
                            (let [value (first values)]
                              (if-some [color (get color-map value)]
                                (recur (conj result {:op "equals" :value value :color color})
                                       (rest values)
                                       used-colors)
                                (let [color (next-point-color used-colors)]
                                  (recur (conj result {:op "equals" :value value :color color})
                                         (rest values)
                                         (conj used-colors color)))))))]
      (sort-point-color-mapping color-mapping))))

(defn shape-color-mapping [layer]
  [{:op "heatmap"
    :stop 0
    :color "#FFFFFF"}
   {:op "heatmap"
    :stop 100
    :color (if (:gradientColor layer)
              (:gradientColor layer)
              (get gradient-palette 0))}])

;; "BOX(-0.127758 51.507351,24.938379 63.095089)"
(defn parse-box [s]
  (let [end (str/index-of s ")")
        box-string (subs s 4 end)
        [left right] (str/split box-string #",")
        [west south] (str/split left #" ")
        [east north] (str/split right #" ")]
    [[(Double/parseDouble south) (Double/parseDouble west)]
     [(Double/parseDouble north) (Double/parseDouble east)]]))

(defn- antimeridian? [opts]
  (= (:centre-of-the-world opts) "antimeridian"))

(defn bounds [tenant-conn table-name layer where-clause opts]
  (let [geom (or (:geom layer)
                 (format "ST_SetSRID(ST_MakePoint(%s, %s), 4326)"
                         (:longitude layer)
                         (:latitude layer)))
        bounds-query (if (antimeridian? opts)
                       "SELECT ST_Extent(ST_ShiftLongitude(%s)) FROM %s WHERE %s"
                       "SELECT ST_Extent(%s) FROM %s WHERE %s")
        sql-str (format bounds-query
                        geom table-name where-clause)]
    (when-some [st-extent (-> (jdbc/query tenant-conn sql-str)
                              first :st_extent)]
      (parse-box st-extent))))

(defn get-column-titles [tenant-conn selector-name selector-value dataset-version-ns]
  (let [sql-str "SELECT columns, modified FROM dataset_version WHERE %s='%s' AND namespace='%s' ORDER BY version DESC LIMIT 1"]
    (map (fn [{:strs [columnName title type]}]
           {:columnName columnName
            :type type
            :title title})
         (-> (jdbc/query tenant-conn (format sql-str selector-name selector-value dataset-version-ns))
             first
             :columns))))

(defn get-column-title-for-name [collection column-name]
  (-> (filter (fn [{:keys [columnName]}]
                (boolean (= columnName column-name)))
              collection)
      first
      :title))

(defn point-metadata [tenant-conn table-name layer where-clause opts]
  (let [column-titles (get-column-titles tenant-conn "table_name" table-name "main")]
    {:boundingBox (bounds tenant-conn table-name layer where-clause opts)
     :pointColorMapping (point-color-mapping tenant-conn table-name layer where-clause column-titles)
     :availableColors palette
     :pointColorMappingTitle (get-column-title-for-name column-titles (:pointColorColumn layer))
     :columnTitles column-titles}))

(defn shape-aggregation-metadata [tenant-conn table-name layer where-clause opts]
  (let [column-titles (get-column-titles tenant-conn "table_name" table-name "main")
        column-title-for-name (get-column-title-for-name
                               (get-column-titles tenant-conn "dataset_id" (:aggregationDataset layer) "main")
                               (:aggregationColumn layer))
        shape-color-mapping-title (format "%s (%s)" column-title-for-name
                                          (:aggregationMethod layer))]
    {:boundingBox (bounds tenant-conn table-name layer where-clause opts)
     :shapeColorMapping (shape-color-mapping layer)
     :availableColors gradient-palette
     :columnTitles column-titles
     :shapeColorMappingTitle shape-color-mapping-title}))

(defn shape-metadata [tenant-conn table-name layer where-clause opts]
  (let [column-titles (get-column-titles tenant-conn "table_name" table-name "main")]
    {:columnTitles column-titles
     :boundingBox (bounds tenant-conn table-name layer where-clause opts)}))

(defn raster-metadata [tenant-conn table-name layer where-clause opts]
  (let [raster-meta (walk/keywordize-keys (jdbc/query tenant-conn ["SELECT metadata FROM raster_dataset WHERE raster_table = ?" table-name]))
        {{:keys [bbox]} :metadata} (first raster-meta)]
    (merge
      {:max (:max (:metadata (first raster-meta)) )
       :min (:min (:metadata (first raster-meta)))}
      (if bbox
        (let [shift-longitude (if-not (antimeridian? opts)
                                identity
                                (fn [[lat long]]
                                  [lat (if (neg? long) (+ 360 long) long)]))]
          {:boundingBox [(shift-longitude (reverse (first bbox))) (shift-longitude (reverse (second bbox)))]})
        {}))))

(defn get-metadata [{:keys [aggregationDataset aggregationColumn aggregationGeomColumn layerType]
                     :as layer}]
  (cond
    (= layerType "raster")
    raster-metadata

    (and aggregationDataset aggregationColumn aggregationGeomColumn)
    shape-aggregation-metadata

    (= layerType "geo-shape")
    shape-metadata

    :else
    point-metadata))

(defn build [tenant-conn table-name layer where-clause opts]
  ((get-metadata layer) tenant-conn table-name layer where-clause opts))
