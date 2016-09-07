(ns org.akvo.lumen.lib.visualisation
  (:require [org.akvo.lumen.lib.visualisation-impl :as impl]))


(defn all
  "Returns all visualisations."
  [tenant-conn]
  (impl/all tenant-conn))

(defn create
  "Creates a new visualisation. Body should include keys and spec conform
  to..."
  [tenant-conn body claims]
  (impl/create tenant-conn body claims))

(defn fetch
  "Get a single visualisation."
  [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn upsert
  "Update or insert a visualisation. Body should conform to spec ..."
  [tenant-conn body claims]
  (impl/upsert tenant-conn body claims))

(defn delete
  "Delete"
  [tenant-conn id]
  (impl/delete tenant-conn id))
