(ns akvo.lumen.lib.visualisation.map-metadata
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]))

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
                        where-clause)})
