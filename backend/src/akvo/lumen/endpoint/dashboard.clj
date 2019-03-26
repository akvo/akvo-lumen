(ns akvo.lumen.endpoint.dashboard
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dashboard :as dashboard]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/dashboards"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-datasets :auth-datasets}]
                         (dashboard/all (p/connection tenant-manager tenant) auth-datasets))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              auth-datasets :auth-datasets
                              body :body}]
                          (dashboard/create (p/connection tenant-manager tenant) body jwt-claims auth-datasets))}}]
   ["/:id" {:get {:parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 auth-datasets :auth-datasets
                                 {:keys [id]} :path-params}]
                             (dashboard/auth-fetch (p/connection tenant-manager tenant) id auth-datasets))}
            :put {:parameters {:body map?
                               :path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 body :body
                                 auth-datasets :auth-datasets
                                 {:keys [id]} :path-params}]
                             (dashboard/upsert (p/connection tenant-manager tenant) id body auth-datasets))}
            :delete {:parameters {:path-params {:id string?}}
                     :handler (fn [{tenant :tenant
                                    auth-datasets :auth-datasets
                                    {:keys [id]} :path-params}]
                                (dashboard/delete (p/connection tenant-manager tenant) id auth-datasets))}}]])

(defmethod ig/init-key :akvo.lumen.endpoint.dashboard/dashboard  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.dashboard/dashboard [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
