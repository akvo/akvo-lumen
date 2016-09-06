(ns org.akvo.lumen.endpoint.job-execution
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.job-execution :as job-execution]
            [ring.util.response :as response]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/job_executions" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (if-let [status (job-execution/status tenant-conn id)]
          (response/response status)
          (response/not-found {"jobExecutionId" id}))))))
