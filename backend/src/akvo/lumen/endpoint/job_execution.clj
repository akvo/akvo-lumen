(ns akvo.lumen.endpoint.job-execution
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.job-execution :as job-execution]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/job_executions" {:keys [tenant]}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (context "/:id" [id]
        (GET "/" _
          (job-execution/status tenant-conn id))))))

(defmethod ig/init-key :akvo.lumen.endpoint.job-execution/job-execution  [_ opts]
  (endpoint opts))
