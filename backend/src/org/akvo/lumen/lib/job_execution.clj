(ns org.akvo.lumen.lib.job-execution
  (:require [org.akvo.lumen.lib.job-execution-impl :as impl]))


(defn status
  "Return status of a job execution."
  [tenant-conn id]
  (impl/status tenant-conn id))
