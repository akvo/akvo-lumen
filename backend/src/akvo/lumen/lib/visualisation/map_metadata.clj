(ns akvo.lumen.lib.visualisation.map-metadata
  (:require [clojure.java.jdbc :as jdbc]
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

(defn next-color [used-colors]
  (some (fn [color] (if (contains? used-colors color) false color)) palette))

(defn point-color-mapping
  [tenant-conn table-name {:strs [pointColorMapping pointColorColumn]}]
  (when pointColorColumn
    (let [distinct-values (map :value
                               (jdbc/query tenant-conn
                                           (format "SELECT distinct %s AS value FROM %s LIMIT 22" pointColorColumn table-name)))
          used-colors (set (map #(get "color" %) pointColorMapping))
          color-map (reduce (fn [m {:strs [value color]}]
                              (assoc m value color))
                            {}
                            pointColorMapping)]
      (loop [result []
             values distinct-values
             used-colors used-colors]
        (if (empty? values)
          result
          (let [value (first values)]
            (if-some [color (get color-map value)]
              (recur (conj result {"op" "equals" "value" value "color" color})
                     (rest values)
                     used-colors)
              (let [color (next-color used-colors)]
                (recur (conj result {"op" "equals" "value" value "color" color})
                       (rest values)
                       (conj used-colors color))))))))))

;; "BOX(-0.127758 51.507351,24.938379 63.095089)"
(defn parse-box [s]
  (let [end (str/index-of s ")")
        box-string (subs s 4 end)
        [left right] (str/split box-string #",")
        [west south] (str/split left #" ")
        [east north] (str/split right #" ")]
    [[(Double/parseDouble south) (Double/parseDouble west)]
     [(Double/parseDouble north) (Double/parseDouble east)]]))

(defn bounds [tenant-conn table-name layer where-clause]
  (let [geom (or (get layer "geom")
                 (format "ST_SetSRID(ST_MakePoint(%s, %s), 4326)"
                         (get layer "longitude")
                         (get layer "latitude")))]
    (-> (jdbc/query tenant-conn
                    (format "SELECT ST_Extent(%s) FROM %s WHERE %s" geom table-name where-clause))
        first :st_extent parse-box)))

(defn build [tenant-conn table-name map-spec where-clause]
  (let [layer (get-in map-spec ["spec" "layers" 0])]
    {"boundingBox" (bounds tenant-conn table-name
                           layer
                           where-clause)
     "pointColorMapping" (point-color-mapping tenant-conn table-name layer)
     "availableColors" palette}))
