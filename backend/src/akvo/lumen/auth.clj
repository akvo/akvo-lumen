(ns akvo.lumen.auth
  (:require
   [akvo.lumen.auth.api-authorization :refer [api-authorization]]
   [akvo.lumen.auth.jwt-authentication :refer [jwt-authentication]]
   [akvo.lumen.auth.jwt-authorization :refer [jwt-authorization]]
   [akvo.lumen.auth.utils :refer [issuer-type]]
   [akvo.lumen.component.auth0 :as auth0]
   [akvo.lumen.component.keycloak :as keycloak]
   [akvo.lumen.protocols :as p]
   [akvo.lumen.util :refer [as-middleware]]
   [clojure.spec.alpha :as s]
   [clojure.string :as string]
   [integrant.core :as ig]))


(s/def ::keycloak-public-client ::keycloak/public-client)
(s/def ::auth0-public-client ::auth0/public-client)

(s/def ::api-authz-probability
  (s/and double? #(>= % 0) #(<= % 1)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Authentication
;;;

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt-authentication
  [_ opts]
  (as-middleware jwt-authentication opts))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt-authentication
  [_]
  (s/keys :req-un [::keycloak-public-client ::auth0-public-client ::p/authorizer]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Authorization
;;;

(defmulti authorize
  (fn [handler {:keys [jwt-claims]}
       {:keys [keycloak-public-client auth0-public-client]}]
    (issuer-type jwt-claims keycloak-public-client auth0-public-client)))

(defmethod authorize :auth0
  [handler request opts]
  (api-authorization handler request (select-keys opts [:authorizer])))

(defmethod authorize :keycloak
  [handler {:keys [jwt-claims] :as request} {:keys [api-authz-probability] :as opts}]
  (let [{:strs [email family_name]} jwt-claims
        api-authorization? (and
                            (and (some? family_name) (string/ends-with? family_name "$auth"))
                            (and (some? email) (string/ends-with? email "@akvo.org")))]
    (if api-authorization?
      (api-authorization handler request (select-keys opts [:authorizer]))
      (do
        (when (> (rand) (- 1.0 api-authz-probability))
          (future (api-authorization handler request (select-keys opts [:authorizer]))))
        (jwt-authorization handler request
                           (select-keys opts [:auth0-public-client :keycloak-public-client]))))))


(defmethod ig/init-key :akvo.lumen.auth/wrap-authorization
  [_ opts]
  (as-middleware authorize opts))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-authorization
  [_]
  (s/keys :req-un [::keycloak-public-client ::auth0-public-client ::p/authorizer ::api-authz-probability]))
