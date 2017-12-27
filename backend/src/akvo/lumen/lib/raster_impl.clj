(ns akvo.lumen.lib.raster-impl
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.import.common :as import]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.update :as update]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.java.shell :as shell]
            [clojure.string :as str]
            [hugsql.core :as hugsql])
  (:import [java.util UUID]))

(hugsql/def-db-fns "akvo/lumen/lib/raster.sql")
(hugsql/def-db-fns "akvo/lumen/job-execution.sql")

(defn get-raster-info
  "Returns a JSON representation of gdalinfo output or nil if
  something goes wrong"
  [path filename]
  (let [src (str path "/" filename)
        info (try
               (shell/sh "gdalinfo" "-json" src)
               (catch Exception _))]
    (when info
      (json/parse-string (:out info)))))

(defn project-and-compress
  "Reprojects and compress a GeoTIFF using ESPG:3857 and LZW"
  [path filename]
  (let [src (str path "/" filename)
        new-file (str (UUID/randomUUID) ".tif")
        dst (str path "/" new-file)]
    {:filename new-file
     :path path
     :shell (shell/sh "gdalwarp" "-co" "COMPRESS=LZW" "-t_srs" "EPSG:3857" src dst)}))

(defn get-raster-data-as-sql
  [path filename table-name]
  (let [shell (shell/sh "raster2pgsql" "-a" "-t" "256x256" "-s" "3857" (str path "/" filename) table-name)]
    (if (zero? (:exit shell))
      (:out shell)
      (prn (:err shell)))))


(defn all [conn]
  (lib/ok (all-rasters conn)))

(defn do-import [conn config data-source job-execution-id]
  (let [source (get data-source "source")
        file (import/get-path source (:file-upload-path config))
        path (.getAbsolutePath (.getParentFile file))
        filename (.getName file)
        table-name (util/gen-table-name "raster")
        prj (project-and-compress path filename)
        sql (get-raster-data-as-sql (:path prj) (:filename prj) table-name)]
    ;; FIXME this is the happy path
    (create-raster-table conn {:table-name table-name})
    (create-raster-index conn {:table-name table-name})
    (jdbc/execute! conn [sql])
    (add-raster-constraints conn {:table-name table-name})
    (insert-raster conn {:id (util/squuid)
                         :title (data-source "name")
                         :description (get-in data-source ["source" "fileName"])
                         :job-execution-id job-execution-id
                         :raster-table table-name})
    (update-successful-job-execution conn {:id job-execution-id})))

(defn create [conn config claims data-source]
  (let [data-source-id (str (util/squuid))
        job-execution-id (str (util/squuid))
        table-name (util/gen-table-name "ds")
        kind (get-in data-source ["source" "kind"])]
    (insert-data-source conn {:id data-source-id
                              :spec (json/generate-string data-source)})
    (insert-job-execution conn {:id job-execution-id
                                :data-source-id data-source-id})
    (future (do-import conn config data-source job-execution-id))
    (lib/ok {"importId" job-execution-id
             "kind" kind})))

(defn fetch [conn id]
  (if-let [raster (raster-by-id conn {:id id})]
    (lib/ok
     {:id id
      :name (:title raster)
      :modified (:modified raster)
      :created (:created raster)
      :status "OK"
      :raster_table (:raster_table raster)})
    (lib/not-found {:error "Not found"})))


(defn delete [conn id]
  #_(let [c (delete-dataset-by-id tenant-conn {:id id})]
    (if (zero? c)
      (do
        (delete-failed-job-execution-by-id tenant-conn {:id id})
        (lib/not-found {:error "Not found"}))
      (lib/ok {:id id}))))
