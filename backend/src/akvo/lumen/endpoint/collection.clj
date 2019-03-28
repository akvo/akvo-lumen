(ns akvo.lumen.endpoint.collection
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.collection :as collection]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.collection :as collection]
            [clojure.walk :refer (stringify-keys)]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/collections"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-datasets :auth-datasets}]
                         (collection/all (p/connection tenant-manager tenant) auth-datasets))}
        :post {:responses {200 {}}
               :parameters {:body map?}
               :handler (fn [{tenant :tenant
                              auth-datasets :auth-datasets
                              body :body}]
                          (collection/create (p/connection tenant-manager tenant) (stringify-keys body) auth-datasets))}}]
   ["/:id" {:get {:responses {200 {}}
                  :parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 auth-datasets :auth-datasets
                                 {:keys [id]} :path-params}]
                             (collection/fetch (p/connection tenant-manager tenant) id auth-datasets))}
            :put {:responses {200 {}}
                  :parameters {:body map?
                               :path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 body :body
                                 auth-datasets :auth-datasets
                                 {:keys [id]} :path-params}]
                             (collection/update (p/connection tenant-manager tenant) id body auth-datasets))}
            :delete {:parameters {:path-params {:id string?}}
                     :handler (fn [{tenant :tenant
                                    auth-datasets :auth-datasets
                                    {:keys [id]} :path-params}]
                                (collection/delete (p/connection tenant-manager tenant) id auth-datasets))}}]])

(defmethod ig/init-key :akvo.lumen.endpoint.collection/collection  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.collection/collection [_]
  (s/keys :req-un [::tenant-manager/tenant-manager]))
