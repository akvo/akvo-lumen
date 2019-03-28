(ns akvo.lumen.endpoint.job-execution
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.job-execution :as job-execution]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn handler [{:keys [tenant-manager] :as opts}]
  (fn [{{:keys [id kind]} :path-params
        tenant :tenant}]
    (let [tenant-conn (p/connection tenant-manager tenant)]
      (job-execution/status tenant-conn (keyword kind) id))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/job_executions/:kind/:id"
   {:get {:parameters {:path-params {:kind string?
                                     :id string?}}
          :responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.job-execution/job-execution  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.job-execution/job-execution [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
