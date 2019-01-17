(ns akvo.lumen.endpoint.collection
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.collection :as collection]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.collection :as collection]
            [clojure.walk :refer (stringify-keys)]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/collections"
   ["" {:get {:handler (fn [{tenant :tenant}]
                       (log/error tenant (collection/all (p/connection tenant-manager tenant)))
                       (collection/all (p/connection tenant-manager tenant)))}
        :post {:responses {200 {}}
             :parameters {:body map?}
             :handler (fn [{tenant :tenant
                            body :body}]
                        (log/error body)
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

(defmethod integrant-key :akvo.lumen.endpoint.collection/collection [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
