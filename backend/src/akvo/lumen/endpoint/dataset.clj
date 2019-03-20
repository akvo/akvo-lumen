(ns akvo.lumen.endpoint.dataset
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.component.flow :as c.flow]
            [clojure.tools.logging :as log]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.component.keycloak :as keycloak]
            [clojure.walk :as w]
            [akvo.lumen.component.error-tracker :as error-tracker]
            [akvo.lumen.upload :as upload]
            [akvo.commons.jwt :as jwt]
            [integrant.core :as ig]))

(defn routes [{:keys [upload-config import-config error-tracker tenant-manager] :as opts}]
  ["/datasets"
   ["" {:get {:handler (fn [{tenant :tenant
                             :as request}]
                         (dataset/all (p/connection tenant-manager tenant) (:flow-api import-config) (jwt/jwt-token request)))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              body :body}]
                          (dataset/create (p/connection tenant-manager tenant) (merge import-config upload-config)
                                          error-tracker jwt-claims (w/stringify-keys body)))}}]
   ["/:id" [["" {:get {:parameters {:path-params {:id string?}}
                       :handler (fn [{tenant :tenant
                                      {:keys [id]} :path-params
                                      :as request}]
                                  (dataset/fetch (p/connection tenant-manager tenant) id (jwt/jwt-token request)))}
                 :put {:parameters {:body map?
                                    :path-params {:id string?}}
                       :handler (fn [{tenant :tenant
                                      body :body
                                      {:keys [id]} :path-params
                                      :as request}]
                                  (dataset/update-meta (p/connection tenant-manager tenant) id body (jwt/jwt-token request)))}
                 :delete {:parameters {:path-params {:id string?}}
                          :handler (fn [{tenant :tenant
                                         {:keys [id]} :path-params
                                         :as request}]
                                     (dataset/delete (p/connection tenant-manager tenant) id (jwt/jwt-token request)))}}]
            ["/meta" {:get {:parameters {:path-params {:id string?}}
                            :handler (fn [{tenant :tenant
                                           {:keys [id]} :path-params
                                           :as request}]
                                       (dataset/fetch-metadata (p/connection tenant-manager tenant) id (jwt/jwt-token request)))}}]
            ["/update" {:post {:parameters {:path-params {:id string?}}
                               :handler (fn [{tenant :tenant
                                              jwt-claims :jwt-claims
                                              body :body
                                              {:keys [id]} :path-params
                                              :as request}]
                                          (dataset/update (p/connection tenant-manager tenant) (merge import-config upload-config)
                                                          error-tracker id (w/stringify-keys body) (jwt/jwt-token request)))}}]]]])


(defmethod ig/init-key :akvo.lumen.endpoint.dataset/dataset  [_ opts]
  (routes opts))

(s/def ::upload-config ::upload/config)
(s/def ::flow-api :akvo.lumen.component.flow/config)
(s/def ::keycloak ::keycloak/data)
(s/def ::import-config (s/keys :req-un [::flow-api]))
(s/def ::config (s/keys :req-un [::tenant-manager/tenant-manager
                                 ::error-tracker/error-tracker
                                 ::upload-config
                                 ::import-config]))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.dataset/dataset [_]
  ::config)
