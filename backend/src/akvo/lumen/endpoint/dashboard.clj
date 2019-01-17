(ns akvo.lumen.endpoint.dashboard
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/dashboards"
   ["" {:get {:handler (fn [{tenant :tenant}]
                         (dashboard/all (p/connection tenant-manager tenant)))}
        :post {:responses {200 {}}
               :parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              body :body}]
                          (dashboard/create (p/connection tenant-manager tenant) body jwt-claims))}}]
   ["/:id" {:get {:responses {200 {}}
                  :parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 {:keys [id]} :path-params}]
                             (dashboard/fetch (p/connection tenant-manager tenant) id))}
            :put {:responses {200 {}}
                  :parameters {:body map?
                               :path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 body :body
                                 {:keys [id]} :path-params}]
                             (dashboard/upsert (p/connection tenant-manager tenant) id body))}
            :delete {:parameters {:path-params {:id string?}}
                         :handler (fn [{tenant :tenant
                                        {:keys [id]} :path-params}]
                                    (dashboard/delete (p/connection tenant-manager tenant) id))}}]])

(defmethod ig/init-key :akvo.lumen.endpoint.dashboard/dashboard  [_ opts]
  (routes opts))

(defmethod integrant-key :akvo.lumen.endpoint.dashboard/dashboard [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
