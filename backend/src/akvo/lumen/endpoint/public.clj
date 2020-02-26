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

(defn handler [{:keys [tenant-manager windshaft-url collector]}]
  (fn [{{:keys [id]} :path-params
        query-params :query-params
        tenant :tenant
        headers :headers}]
    (let [tenant-conn (p/connection tenant-manager tenant)
          password (get headers "x-password")
          filters (dashboard/extract-query-filter query-params)]
      (when (seq (:columns filters))
        (prometheus/inc
         (registry/get collector :app/dashboard-apply-filter {"tenant" tenant
                                                              "dashboard" id})))
      (public/share tenant-conn windshaft-url id password filters))))

(defn routes [{:keys [tenant-manager collector] :as opts}]
  [["/:id"
    ["" {:get {:parameters {:path-params {:id string?}}
            :handler (handler opts)}}]
    ["/dataset/:dataset-id/column/:column-name"

     {:get {:parameters e.dataset/fetch-column-params
            :handler (fn [{tenant :tenant
                           headers :headers
                           {:keys [id dataset-id column-name]} :path-params

                           query-params :query-params}]
                       (let [password (get headers "x-password")
                             tenant-conn (p/connection tenant-manager tenant)]
                         (if-let [share (public/share* tenant-conn id)]
                           (if-let [auth-share (public/auth-share* share password)]
                             (lib/ok
                              (dataset/sort-text tenant-conn dataset-id column-name (get query-params "limit")))
                             (lib/not-authorized {:share-id id}))
                           (lib/not-found {:share-id id})
                           )
))}}
     ]]])

(defmethod ig/init-key :akvo.lumen.endpoint.public/public  [_ opts]
  (routes opts))
