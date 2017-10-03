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

#_(defn point-colors
    [tenant-conn table-name pointColorColumn]
    (when (not (nil? pointColorColumn))
      (let [query-str (format "SELECT %s AS options, count(*) as n FROM %s GROUP BY %s LIMIT 5"
                              pointColorColumn table-name pointColorColumn)]
        (jdbc/query tenant-conn [query-str]))))

(defn color-point-mapping
  [tenant-conn table-name {:strs [pointColorMapping pointColorColumn]}]
  (when pointColorColumn
    (let [distinct-values (map :value
                               (jdbc/query tenant-conn
                                           (format "SELECT distinct %s AS value FROM %s LIMIT 22" pointColorColumn table-name)))]
      (for [value distinct-values]

        )
      )
    ))

;; "BOX(-0.127758 51.507351,24.938379 63.095089)"
(defn parse-box [s]
  (let [end (str/index-of s ")")
        box-string (subs s 4 end)
        [left right] (str/split box-string #",")
        [west south] (str/split left #" ")
        [east north] (str/split right #" ")]
    [[(Double/parseDouble south) (Double/parseDouble west)]
     [(Double/parseDouble north) (Double/parseDouble east)]]))

(defn bounds [tenant-conn table-name geom-column where-clause]
  (-> (jdbc/query tenant-conn
                  (format "SELECT ST_Extent(%s) FROM %s WHERE %s" geom-column table-name where-clause))
      first :st_extent parse-box))

(defn build [tenant-conn table-name map-spec where-clause]
  {:boundingBox (bounds tenant-conn table-name
                        (get-in map-spec ["spec" "layers" 0 "geomColumn"])
                        where-clause)
   :availableColors palette})
