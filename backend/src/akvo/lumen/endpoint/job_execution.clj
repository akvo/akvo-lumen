(ns akvo.lumen.endpoint.job-execution
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.job-execution :as job-execution]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/job_executions" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (context "/:id" [id]
        (GET "/" _
          (job-execution/status tenant-conn id))

        (DELETE "/" _
          (job-execution/delete tenant-conn id))))))


(defmethod ig/init-key :akvo.lumen.endpoint.job-execution  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.job-execution :opts opts)
  endpoint)

(defmethod ig/halt-key! :akvo.lumen.endpoint.job-execution  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.job-execution opts))
