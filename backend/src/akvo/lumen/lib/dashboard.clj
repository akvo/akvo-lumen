(ns akvo.lumen.lib.dashboard
  (:require [akvo.lumen.lib.dashboard-impl :as impl]))


(defn all
  "Returns all dashboards."
  [tenant-conn]
  (impl/all tenant-conn))

(defn create
  "Creates a new dashboard."
  [tenant-conn spec claims]
  (impl/create tenant-conn spec claims))

(defn fetch
  "Get a single dashboard."
  [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn upsert
  "Update or insert a dashboard."
  [tenant-conn id spec]
  (impl/upsert tenant-conn id spec))

(defn delete
  "Delete dashboard."
  [tenant-conn id]
  (impl/delete tenant-conn id))
