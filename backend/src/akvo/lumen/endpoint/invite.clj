(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.user :as user]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.auth0 :as auth0]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.component.keycloak :as keycloak]
            [integrant.core :as ig]))

(defn location
  ""
  [{:keys [client-port scheme] :as config} {:keys [server-name]}]
  (if (nil? config)
    (format "https://%s" server-name)
    (format "%s://%s:%s" (name scheme) server-name client-port)))

(defn admin-routes [{:keys [config emailer keycloak auth0-public-client tenant-manager] :as opts}]
  ["/admin/invites"
   ["" {:get {:handler (fn [{tenant :tenant}]
                         (user/active-invites (p/connection tenant-manager tenant)))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              body :body :as request}]
                          (let [auth-type            (if (= (get jwt-claims "iss") (:issuer auth0-public-client))
                                                       :auth0
                                                       :keycloak)]
                            (user/create-invite emailer keycloak (p/connection tenant-manager tenant) auth-type
                                                tenant (location (:invite-redirect config) request)
                                                (get body "email") jwt-claims)))}}]
   ["/:id" {:delete {:parameters {:path-params {:id string?}}
                     :handler (fn [{tenant :tenant
                                 {:keys [id]} :path-params}]
                                (user/delete-invite (p/connection tenant-manager tenant) id))}}]])

(defn verify-routes [{:keys [config keycloak tenant-manager] :as opts}]
  ["/:id" {:get {:parameters {:path-params {:id string?}}
                 :handler (fn [{tenant :tenant
                                query-params :query-params
                                {:keys [id]} :path-params :as request}]
                            (let [auth-system (get query-params "auth")]
                              (user/verify-invite keycloak
                                                  (p/connection tenant-manager tenant)
                                                  tenant id (str (location (:invite-redirect config) request)
                                                                 "?auth=" auth-system))))}}])

(defmethod ig/init-key :akvo.lumen.endpoint.invite/invite  [_ opts]
  (admin-routes opts))

(defmethod ig/init-key :akvo.lumen.endpoint.invite/verify  [_ opts]
  (verify-routes opts))

(s/def ::auth0-public-client ::auth0/public-client)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.invite/invite [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::p/authorizer
                   ::auth0-public-client
                   ::emailer/emailer]))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.invite/verify [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::p/authorizer]))
