(ns akvo.lumen.auth.jwt-authentication
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.component.auth0 :as auth0]
   [akvo.lumen.auth.utils :refer [issuer-type]]
   [akvo.lumen.protocols :as p]
   [akvo.lumen.component.keycloak :as keycloak])
  (:import
   com.nimbusds.jose.crypto.RSASSAVerifier
   java.text.ParseException))

(defn create-RSASSAVerifier
  [public-key]
  (RSASSAVerifier. public-key))

(def RSASSA-verifier (memoize create-RSASSAVerifier))

(defn jwt-authentication
  [handler {:keys [tenant] :as request}
   {:keys [keycloak-public-client auth0-public-client authorizer]}]
  (let [auth0-verifier (RSASSA-verifier (:rsa-key auth0-public-client))
        keycloak-verifier (RSASSA-verifier (:rsa-key keycloak-public-client))]
    (if-let [token (jwt/jwt-token request)]
      (try
        (if-let [claims (or (jwt/verified-claims token keycloak-verifier
                                                 (:issuer keycloak-public-client)
                                                 {})
                            (jwt/verified-claims token auth0-verifier
                                                 (:issuer auth0-public-client)
                                                 {}))]
          (handler (assoc request :jwt-claims claims :jwt-token token))
          (handler request))
        (catch ParseException e
          (handler request)))
      (handler request))))
