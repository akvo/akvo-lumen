(ns akvo.lumen.import.raster
  (:require [akvo.lumen.import.common :as import]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.java.shell :as shell]
            [clojure.string :as string]
            [hugsql.core :as hugsql])
  (:import [java.util UUID]))


(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/import/raster.sql")

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


(defn do-import [conn config job-execution-id]
  (let [job (data-source-spec-by-job-execution-id conn {:job-execution-id job-execution-id})
        spec (get-in job [:spec "source"])
        file (import/get-path spec (:file-upload-path config))
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
    (update-successful-job-execution conn {:id job-execution-id})))
