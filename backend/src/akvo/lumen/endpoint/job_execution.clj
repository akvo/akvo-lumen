(ns akvo.lumen.endpoint.job-execution
  (:require [compojure.core :refer :all]
            [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.job-execution :as job-execution]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/job_executions" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (job-execution/status tenant-conn id)))))
