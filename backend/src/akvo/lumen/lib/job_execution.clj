(ns akvo.lumen.lib.job-execution
  (:require [akvo.lumen.lib.job-execution-impl :as impl]))


(defn status
  "Return status of a job execution."
  [tenant-conn id]
  (impl/job-status tenant-conn id))

(defn delete
  "Return status of a job execution."
  [tenant-conn id]
  (impl/delete tenant-conn id))
