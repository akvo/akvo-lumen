(ns akvo.lumen.import.raster
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.java.shell :as shell]
            [clojure.string :as string]
            [hugsql.core :as hugsql])
  (:import [java.util UUID]))


(hugsql/def-db-fns "akvo/lumen/import/raster.sql")

(defn project-to-web-mercator
  "Reprojects the GeoTIFF using ESPG:3857 (Web Mercator)"
  [path filename]
  {:pre [(.endsWith filename ".tif")]}
  (let [src (str path "/" filename)
        new-file (str (UUID/randomUUID) ".tif")
        dst (str "/tmp/" new-file)]
    {:filename new-file
     :path "/tmp"
     :shell (shell/sh "gdalwarp" "-ot" "Byte" "-co" "COMPRESS=LZW" "-t_srs" "EPSG:3857" src dst)}))

(defn get-file-info
  "Shells out and returns the execution of `gdalinfo`
  See clojure.java.shell for return values"
  [path filename]
  (let [src (str path "/" filename)]
    {:path path
     :filename filename
     :shell (shell/sh "gdalinfo" src)}))

(defn web-mercator?
  "Predicate to check the projection of a file based on
  `gdalinfo` output"
  [file-info]
  (boolean (re-find #"EPSG.*3857" file-info)))

(defn get-raster-data-as-sql
  [path filename table-name]
  (let [shell (shell/sh "raster2pgsql" "-a" "-t" "256x256" "-s" "3857" (str path "/" filename) table-name)]
    (if (zero? (:exit shell))
      (:out shell)
      (prn (:err shell)))))
