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
    [[(Double/parseDouble west) (Double/parseDouble south)]
     [(Double/parseDouble east) (Double/parseDouble north)]]))

(defn bounds [tenant-conn table-name geom-column]
  (let [box (:st_extent (first (jdbc/query tenant-conn
                                           (format "SELECT ST_Extent(%s) FROM %s" geom-column table-name))))]
    (parse-box box)))

(defn build [tenant-conn columns table-name map-spec]
  {:boundingBox (bounds tenant-conn table-name
                        (get-in map-spec ["spec" "layers" 0 "geomColumn"]))
   :popupColumns (map #(select-keys % ["columnName" "title" "type"])
                      columns)})
