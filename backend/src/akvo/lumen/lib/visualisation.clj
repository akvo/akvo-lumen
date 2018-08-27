(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib.visualisation-impl :as impl]))


(defn all
  "Returns all visualisations."
  [tenant-conn]
  (impl/all tenant-conn))

(defn create
  "Creates a new visualisation."
  [tenant-conn body claims]
  (impl/create tenant-conn body claims))

(defn fetch
  "Get a single visualisation."
  [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn upsert
  "Update or insert a visualisation."
  [tenant-conn body claims]
  (impl/upsert tenant-conn body claims))

(defn delete
  "Delete"
  [tenant-conn id]
  (impl/delete tenant-conn id))

(defn export
  [exporter-url access-token locale spec]
  (impl/export exporter-url access-token locale spec))
