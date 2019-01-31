(ns akvo.lumen.lib.raster
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.java.shell :as shell]
            [clojure.set :refer (rename-keys)]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql])
  (:import [java.util UUID]
           [org.postgresql.util PGobject]))

(hugsql/def-db-fns "akvo/lumen/lib/raster.sql")
(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(defn get-raster-info
  "Returns a JSON representation of gdalinfo output or nil if
  something goes wrong"
  [path filename]
  (let [src (str path "/" filename)
        info (try
               (shell/sh "gdalinfo" "-json" src)
               (catch Exception e
                 (log/errorf e "Error trying to obtain raster info for: %s" src)))]
    (when info
      (json/parse-string (:out info)))))

(defn bbox [{:strs [cornerCoordinates]}]
  (when cornerCoordinates
    [(cornerCoordinates "lowerLeft") (cornerCoordinates "upperRight")]))

(defn project-and-compress
  "Reprojects and compress a GeoTIFF using ESPG:3857 and LZW"
  [path filename]
  (let [src (str path "/" filename)
        new-file (str (UUID/randomUUID) ".tif")
        dst (str path "/" new-file)
        shell (shell/sh "gdalwarp" "-co" "COMPRESS=LZW" "-t_srs" "EPSG:3857" src dst)]
    (if (zero? (:exit shell))
      new-file
      (throw (:err shell)))))

(defn get-raster-data-as-sql
  [path filename table-name]
  (-> (Runtime/getRuntime)
      (.exec (format "raster2pgsql -a -t 128x128 -s 3867 %s %s" (str path "/" filename) table-name))
      (.getInputStream)))

;; https://github.com/CartoDB/cartodb/wiki/Automatic-raster-overviews
;; For PostGIS-Rasters-Support, the importer could use 'gdalinfo' to
;; extract the raster size in pixel and then specify overviews as
;; powers of 2 (2,4,8,16...) until the one that would result in a
;; single 256 tile being generated.
;; Example:
;; * gdalinfo HYP_HR.tif | grep '^Size is ' # Size is 21600, 10800
;; * take larger dimension: 21600
;; * compute max power of 2 needed: ceil(log2(21600/256)) == 7
;; * overviews are: 2^1, 2^2, 2^3, 2^4, 2^5, 2^6, 2^7,
;; * so: raster2pgsql -l 2,4,8,16,32,64,128
;; We can play with the parameters to for example
;; stop when we have a 4-tiles coverage:
;; ceil(log2(max_dim/tile_size*max_tiles_per_side))

(defn get-overviews
  [raster-info]
  (let [tile-size 256
        max-size (apply max (raster-info "size"))
        log-2 (/ (Math/log (/ max-size tile-size)) (Math/log 2))
        ceil (int (Math/ceil log-2))]
    (for [i (range 1 (inc ceil))]
      (int (Math/pow 2 i)))))

(defn all [conn]
  (lib/ok (all-rasters conn)))

(defn do-import [conn file-upload-path claims data-source job-execution-id]
  (let [table-name (util/gen-table-name "raster")]
    (try
      (let [source      (get data-source "source")
            file        (util/get-path source file-upload-path)
            path        (.getAbsolutePath (.getParentFile file))
            filename    (.getName file)
            raster-info (get-raster-info path filename)
            prj-file    (project-and-compress path filename)]
        (create-raster-table conn {:table-name table-name})
        (create-raster-index conn {:table-name table-name})
        (with-open [rdr (io/reader (get-raster-data-as-sql path prj-file table-name))]
          (jdbc/with-db-transaction [tx conn]
            (doseq [line (line-seq rdr)]
              (jdbc/execute! tx [line] {:transaction? false}))))
        (add-raster-constraints conn {:table-name table-name})
        (vacuum-raster-table conn
                             {:table-name table-name}
                             {}
                             {:transaction? false})
        (let [stats    (raster-stats conn {:table-name table-name})
              metadata (merge {:bbox (bbox raster-info)}
                              stats)]
          (insert-raster conn {:id               (util/squuid)
                               :title            (data-source "name")
                               :description      (get-in data-source ["source" "fileName"])
                               :job-execution-id job-execution-id
                               :metadata         (doto (PGobject.)
                                                   (.setType "jsonb")
                                                   (.setValue (json/generate-string metadata)))
                               :raster-table     table-name
                               :author           claims
                               :source           source})
          (update-successful-job-execution conn {:id job-execution-id})))
      (catch Throwable e
        (log/errorf e "Error importing raster: %s" (.getMessage e))
        (update-failed-job-execution conn {:id     job-execution-id
                                           :reason (.getMessage e)})
        (drop-raster-table conn {:table-name table-name})
        (throw e)))))

(defn create [conn file-upload-path claims data-source]
  (let [data-source-id (str (util/squuid))
        job-execution-id (str (util/squuid))
        table-name (util/gen-table-name "ds")
        kind (get-in data-source ["source" "kind"])]
    (insert-data-source conn {:id data-source-id
                              :spec (json/generate-string data-source)})
    (insert-job-execution conn {:id job-execution-id
                                :data-source-id data-source-id})
    (future (do-import conn file-upload-path claims data-source job-execution-id))
    (lib/ok {"importId" job-execution-id
             "kind" kind})))

(defn fetch [conn id]
  (if-let [raster (raster-by-id conn {:id id})]
    (lib/ok
     (-> raster
         (select-keys [:author :created :id :modified :raster_table :source :title])
         (rename-keys {:title :name})
         (assoc :status "OK")))
    (lib/not-found {:error "Not found"})))


(defn delete [conn id]
  (let [c (delete-raster-by-id conn {:id id})]
    (if (zero? c)
      (do
        (delete-failed-job-execution-by-id conn {:id id})
        (lib/not-found {:error "Not found"}))
      (lib/ok {:id id}))))
