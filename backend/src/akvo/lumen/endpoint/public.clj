(ns akvo.lumen.endpoint.public
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.public :as public]
            [cheshire.core :as json]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.endpoint.dataset :as e.dataset]
            [akvo.lumen.endpoint.dashboard :as dashboard]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [iapetos.core :as prometheus]
            [iapetos.registry :as registry]
            [akvo.lumen.monitoring :as monitoring]
            [integrant.core :as ig]))

(s/def ::windshaft-url string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.public/public [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::monitoring/collector
                   ::windshaft-url] ))

(defn routes [{:keys [tenant-manager windshaft-url collector] :as opts}]
  [["/:id"
    {:middleware [(fn [handler]
                   (fn [{tenant :tenant
                         headers :headers
                         {:keys [id]} :path-params
                         :as req}]
                     (let [password (get headers "x-password")
                           tenant-conn (p/connection tenant-manager tenant)]
                       (if-let [share (public/share* tenant-conn id)]
                         (if-let [auth-share (public/auth-share* share password)]
                           (handler (assoc req :auth-share auth-share))                         
                           (lib/not-authorized {"shareId" id}))
                         (lib/not-found {"shareId" id})))))]}
    ["" {:get {:parameters {:path-params {:id string?}}
               :handler (fn [{query-params :query-params
                              tenant :tenant
                              {:keys [id]} :path-params
                              auth-share :auth-share}]
                          (let [filters (dashboard/extract-query-filter query-params)]
                            (when (seq (:columns filters))
                              (prometheus/inc
                               (registry/get collector :app/dashboard-apply-filter {"tenant" tenant
                                                                                    "dashboard" id})))
                            (lib/ok (public/response-data (p/connection tenant-manager tenant)
                                                          auth-share windshaft-url filters))))}}]
    ["/dataset/:dataset-id"
     ["" {:get {:parameters e.dataset/fetch-column-params
                :handler (fn [{tenant :tenant
                               {:keys [dataset-id]} :path-params}]
                           (lib/ok
                            (dataset/fetch (p/connection tenant-manager tenant) dataset-id)))}}]
     ["/column/:column-name" {:get {:parameters e.dataset/fetch-column-params
                                    :handler (fn [{tenant :tenant
                                                   {:keys [dataset-id column-name]} :path-params
                                                   query-params :query-params}]
                                               (let [tenant-conn (p/connection tenant-manager tenant)]
                                                 (lib/ok
                                                  (dataset/sort-text tenant-conn dataset-id column-name (get query-params "limit")))))}}]]]])

(defmethod ig/init-key :akvo.lumen.endpoint.public/public  [_ opts]
  (routes opts))
