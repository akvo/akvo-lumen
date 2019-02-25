(ns akvo.lumen.endpoint.job-execution
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.job-execution :as job-execution]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn handler [{:keys [tenant-manager] :as opts}]
  (fn [{{:keys [id]} :path-params
        tenant :tenant}]
    (let [tenant-conn (p/connection tenant-manager tenant)]
      (job-execution/status tenant-conn id))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/job_executions/:id"
   {:get {:parameters {:path-params {:id string?}}
          :responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.job-execution/job-execution  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.job-execution/job-execution [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
