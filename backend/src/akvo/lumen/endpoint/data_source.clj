(ns akvo.lumen.endpoint.data-source
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.data-source :as data-source]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/data-source/job-execution/:id/status/:status"
   {:delete {:parameters {:path-params {:id string?
                                        :status string?}}
             :handler (fn [{tenant :tenant
                            {:keys [id status]} :path-params}]
                        (data-source/delete (p/connection tenant-manager tenant) id status))}}])

(defmethod ig/init-key :akvo.lumen.endpoint.data-source/data-source  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.data-source/data-source [_]
  (s/keys :req-un [::tenant-manager/tenant-manager]))
