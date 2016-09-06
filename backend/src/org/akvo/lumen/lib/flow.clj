(ns org.akvo.lumen.lib.flow
  (:require [org.akvo.lumen.lib.flow-impl :as impl]))


(defn folders-and-surveys
  ""
  [claims flow-report-database-url org-id]
  (impl/folder-and-surverys claims flow-report-database-url org-id))


(defn instances
  ""
  [claims]
  (impl/instances claims))
