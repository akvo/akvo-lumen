(ns akvo.lumen.lib.raster-impl
  (:require [akvo.lumen.endpoint.job-execution :as job-execution]
            [akvo.lumen.import.common :as import]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.update :as update]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.java.shell :as shell]
            [clojure.string :as str]
            [hugsql.core :as hugsql])
  (:import [java.util UUID]))

(hugsql/def-db-fns "akvo/lumen/lib/raster.sql")
(hugsql/def-db-fns "akvo/lumen/job-execution.sql")

(defn project-and-compress
  "Reprojects and compress a GeoTIFF using ESPG:3857 and LZW"
  [path filename]
  (let [src (str path "/" filename)
        new-file (str (UUID/randomUUID) ".tif")
        dst (str path "/" new-file)]
    {:filename new-file
     :path path
     :shell (shell/sh "gdalwarp" "-ot" "Byte" "-co" "COMPRESS=LZW" "-t_srs" "EPSG:3857" src dst)}))

(defn get-raster-data-as-sql
  [path filename table-name]
  (let [shell (shell/sh "raster2pgsql" "-a" "-t" "256x256" "-s" "3857" (str path "/" filename) table-name)]
    (if (zero? (:exit shell))
      (:out shell)
      (prn (:err shell)))))


(defn all [conn]
  (lib/ok (all-rasters conn)))

(defn create [conn config data-source job-execution-id]
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
    (add-raster-constraints conn {:table-name table-name})
    (jdbc/execute! conn [sql])
    (insert-raster conn {:id (util/squuid)
                         :title (data-source "name")
                         :description (get-in data-source ["source" "fileName"])
                         :raster-table table-name})
    (update-successful-job-execution conn {:id job-execution-id})))

(defn fetch [conn id]
  #_(if-let [dataset (dataset-by-id conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))
          data (rest (jdbc/query conn
                                 [(select-data-sql (:table-name dataset) columns)]
                                 {:as-arrays? true}))]
      (lib/ok
       {:id id
        :name (:title dataset)
        :modified (:modified dataset)
        :created (:created dataset)
        :status "OK"
        :transformations (:transformations dataset)
        :columns columns
        :rows data}))
    (lib/not-found {:error "Not found"})))


(defn delete [conn id]
  #_(let [c (delete-dataset-by-id tenant-conn {:id id})]
    (if (zero? c)
      (do
        (delete-failed-job-execution-by-id tenant-conn {:id id})
        (lib/not-found {:error "Not found"}))
      (lib/ok {:id id}))))
