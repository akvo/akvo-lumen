(ns akvo.lumen.auth
  (:require
   [akvo.lumen.auth.api-authorization :refer [wrap-api-authorization]]
   [akvo.lumen.auth.jwt-authentication :refer [wrap-jwt-authentication]]
   [akvo.lumen.auth.jwt-authorization :refer [wrap-jwt-authorization]]
   [akvo.lumen.component.auth0 :as auth0]
   [akvo.lumen.component.keycloak :as keycloak]
   [akvo.lumen.protocols :as p]
   [clojure.spec.alpha :as s]
   [integrant.core :as ig]))


(s/def ::keycloak-public-client ::keycloak/public-client)
(s/def ::auth0-public-client ::auth0/public-client)


(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt-authentication
  [_ {:keys [keycloak-public-client auth0-public-client authorizer]}]
  (wrap-jwt-authentication keycloak-public-client auth0-public-client authorizer))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt-authentication
  [_]
  (s/keys :req-un [::keycloak-public-client ::auth0-public-client ::p/authorizer]))


(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt-authorization
  [_]
  (s/keys :req-un [::keycloak-public-client ::auth0-public-client]))

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt-authorization
  [_ {:keys [keycloak-public-client auth0-public-client]}]
  (wrap-jwt-authorization keycloak-public-client auth0-public-client))


(defmethod ig/init-key :akvo.lumen.auth/wrap-api-authorization
  [_ {:keys [authorizer]}]
  (wrap-api-authorization authorizer))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-api-authorization
  [_]
  (s/keys :req-un [::p/authorizer]))
