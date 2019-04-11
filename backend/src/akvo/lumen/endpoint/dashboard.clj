(ns akvo.lumen.endpoint.dashboard
  (:require [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.auth :as l.auth]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs.dashboard :as dashboard.s]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defn all-dashboards [auth-service tenant-conn]
  (let [dashboards      (dashboard/all tenant-conn)
        auth-dashboards (->> dashboards
                             (l.auth/ids ::dashboard.s/dashboards)
                             (p/auth auth-service)
                             :auth-dashboards)]
    (log/debug :auth-dashboards auth-dashboards (mapv :id dashboards))
    (->> dashboards
         (filter #(contains? auth-dashboards (:id %)))
         (lib/ok))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/dashboards"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-service :auth-service}]
                         (all-dashboards auth-service (p/connection tenant-manager tenant)))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              body :body}]
                          (dashboard/create (p/connection tenant-manager tenant) body jwt-claims))}}]
   ["/:id" {:get {:parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 {:keys [id]} :path-params}]
                             (dashboard/fetch (p/connection tenant-manager tenant) id))}
            :put {:parameters {:body map?
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

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.dashboard/dashboard [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
