(ns org.akvo.lumen.lib.dashboard
  (:require [org.akvo.lumen.lib.dashboard-impl :as impl]))


(defn all
  "Returns all dashboards."
  [tenant-conn]
  (impl/all-dashboards tenant-conn))

(defn create
  "Creates a new dashboard. Body should include keys and spec conform
  to..."
  [tenant-conn spec]
  (impl/create tenant-conn spec))

(defn fetch
  "Get a single dashboard."
  [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn upsert
  "Update or insert a dashboard. Body should conform to spec ..."
  [tenant-conn id spec]
  (impl/upsert tenant-conn id spec))

(defn delete
  "Delete dashboard"
  [tenant-conn id]
  (impl/delete tenant-conn id))
