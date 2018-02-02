(ns akvo.lumen.lib.raster
  (:require [akvo.lumen.lib.raster-impl :as impl]))


(defn all
  "Return all datasets."
  [conn]
  (impl/all conn))

(defn create
  "Create new raster dataset"
  [conn config data-source job-execution-id]
  (impl/create conn config data-source job-execution-id))

(defn fetch
  "Fetch dataset with id"
  [conn id]
  (impl/fetch conn id))

(defn delete
  "Delete dataset with id"
  [conn id]
  (impl/delete conn id))
