(ns akvo.lumen.endpoint.collection
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.collection :as collection]
            [clojure.spec.alpha :as s]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.collection :as collection]
            [clojure.walk :refer (stringify-keys)]
            [integrant.core :as ig]))

(defn all [auth-service tenant-conn]
  (let [collections (collection/all tenant-conn (:auth-collections-set auth-service))]
    (log/error :collections collections)
    (lib/ok collections)))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/collections"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-service :auth-service}]
                       (all auth-service (p/connection tenant-manager tenant)))}
        :post {:responses {200 {}}
             :parameters {:body map?}
             :handler (fn [{tenant :tenant
                            body :body}]
                        (collection/create (p/connection tenant-manager tenant) (stringify-keys body)))}}]
   ["/:id" {:get {:responses {200 {}}
                  :parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 {:keys [id]} :path-params}]
                             (collection/fetch (p/connection tenant-manager tenant) id))}
            :put {:responses {200 {}}
                  :parameters {:body map?
                               :path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 body :body
                                 {:keys [id]} :path-params}]
                             (collection/update (p/connection tenant-manager tenant) id body))}
            :delete {:parameters {:path-params {:id string?}}
                         :handler (fn [{tenant :tenant
                                        {:keys [id]} :path-params}]
                                    (collection/delete (p/connection tenant-manager tenant) id))}}]])

(defmethod ig/init-key :akvo.lumen.endpoint.collection/collection  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.collection/collection [_]
  (s/keys :req-un [::tenant-manager/tenant-manager]))
