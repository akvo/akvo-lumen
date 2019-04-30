(ns akvo.lumen.endpoint.collection
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.collection :as collection]
            [clojure.spec.alpha :as s]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.auth :as l.auth]
            [akvo.lumen.specs.collection :as collection.s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.walk :as w]
            [clojure.tools.logging :as log]
            [clojure.set :as set]
            [akvo.lumen.lib.collection :as collection]
            [clojure.walk :refer (stringify-keys)]
            [integrant.core :as ig]))

(defn all [auth-service tenant-conn]
  (lib/ok (collection/all tenant-conn (:auth-collections-set auth-service))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/collections"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-service :auth-service}]
                         (all auth-service (p/connection tenant-manager tenant)))}
        :post {:responses {200 {}}
               :parameters {:body map?}
               :handler (fn [{tenant :tenant
                              auth-service :auth-service
                              body :body}]
                          (let [vis-payload (w/keywordize-keys body)
                                ids (l.auth/ids ::collection.s/collection-post-payload vis-payload)]
                            (if (p/optimistic-allow? auth-service ids)
                              (collection/create (p/connection tenant-manager tenant) vis-payload)
                              (lib/not-authorized {:ids ids}))))}}]
   ["/:id"
    {:middleware [(fn [handler]
                    (fn [{{:keys [id]} :path-params
                          auth-service :auth-service
                          :as req}]
                      (if (p/allow? auth-service (l.auth/ids ::collection.s/id id))
                        (handler req)
                        (lib/not-authorized {:id id}))))]}
    ["" {:get {:responses {200 {}}
               :parameters {:path-params {:id string?}}
               :handler (fn [{tenant :tenant
                              {:keys [id]} :path-params}]
                          (collection/fetch (p/connection tenant-manager tenant) id))}
         :put {:responses {200 {}}
               :parameters {:body map?
                            :path-params {:id string?}}
               :handler (fn [{tenant :tenant
                              body :body
                              auth-service :auth-service
                              {:keys [id]} :path-params}]
                        (let [vis-payload (w/keywordize-keys body)
                              ids (l.auth/ids ::collection.s/collection-payload vis-payload)]
                          (if (p/optimistic-allow? auth-service ids)
                            (collection/update (p/connection tenant-manager tenant) id vis-payload)
                            (lib/not-authorized {:ids ids}))))}
         :delete {:parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 {:keys [id]} :path-params}]
                             (collection/delete (p/connection tenant-manager tenant) id))}}]]])

(defmethod ig/init-key :akvo.lumen.endpoint.collection/collection  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.collection/collection [_]
  (s/keys :req-un [::tenant-manager/tenant-manager]))
