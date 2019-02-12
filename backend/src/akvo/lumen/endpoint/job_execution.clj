(ns akvo.lumen.endpoint.job-execution
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.job-execution :as job-execution]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
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

(defmethod integrant-key :akvo.lumen.endpoint.job-execution/job-execution [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
