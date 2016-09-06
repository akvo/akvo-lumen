(ns org.akvo.lumen.lib.visualisation
  (:require [org.akvo.lumen.lib.visualisation-impl :as impl]))


(defn all [tenant-conn]
  (impl/all tenant-conn))

(defn create [tenant-conn body claims]
  (impl/create tenant-conn body claims))

(defn fetch [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn upsert [tenant-conn body claims]
  (impl/upsert tenant-conn body claims))

(defn delete [tenant-conn id]
  (impl/delete tenant-conn id))
