(ns akvo.lumen.import.raster
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.java.shell :as shell])
  (:import [java.util UUID]))

(defn project-to-web-mercator
  "Reprojects the GeoTIFF using ESPG:3857 (Web Mercator)"
  [path filename]
  {:pre [(.endsWith filename ".tif")]}
  (let [src (str path "/" filename)
        new-file (str (UUID/randomUUID) ".tif")
        dst (str "/tmp/" new-file)]
    {:file new-file
     :path "/tmp"
     :shell (shell/sh "gdalwarp" "-ot" "Byte" "-co" "COMPRESS=LZW" "-t_srs" "EPSG:3857" src dst)}))

(defn get-raster-sql
  [path filename]
  (let [src (str path "/" filename)
        file-info (shell/sh "gdalinfo" src)
        webmercator? (boolean (re-find #"EPSG.*3857" (:out file-info)))]
    (assert webmercator?)
    {:shell file-info}))
