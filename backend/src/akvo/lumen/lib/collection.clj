(ns akvo.lumen.lib.collection
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.lib.collection-impl :as impl]))

(defn all [tenant-conn]
  (impl/all tenant-conn))

(defn create [tenant-conn collection]
  (impl/create tenant-conn collection))

(defn fetch [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn update [tenant-conn id collection]
  (impl/update tenant-conn id collection))

(defn delete [tenant-conn id]
  (impl/delete tenant-conn id))
