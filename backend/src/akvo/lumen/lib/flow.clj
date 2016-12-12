(ns akvo.lumen.lib.flow
  (:require [akvo.lumen.lib.flow-impl :as impl]))


(defn folders-and-surveys
  "Return folder and surveyes from report database and org id."
  [claims flow-report-database-url org-id]
  (impl/folder-and-surverys claims flow-report-database-url org-id))

(defn instances
  "Get Flow instances from JWT claims."
  [claims]
  (impl/instances claims))
