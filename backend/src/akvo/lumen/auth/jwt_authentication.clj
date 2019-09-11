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


(defn wrap-jwt-authentication
  "Verify JWT with correct verifier and attach valid claims to request"
  [keycloak-public-client auth0-public-client authorizer]
  (let [keycloak-verifier (RSASSAVerifier. (:rsa-key keycloak-public-client))
        auth0-verifier (RSASSAVerifier. (:rsa-key auth0-public-client))]
    (fn [handler]
      (fn [{:keys [tenant] :as req}]
        (if-let [token (jwt/jwt-token req)]
          (try
            (if-let [claims (or (jwt/verified-claims token keycloak-verifier
                                                     (:issuer keycloak-public-client)
                                                     {})
                                (jwt/verified-claims token auth0-verifier
                                                     (:issuer auth0-public-client)
                                                     {}))]
              (handler (assoc req
                              :jwt-claims claims
                              :auth-roles (if (= :keycloak
                                                 (issuer-type claims
                                                              keycloak-public-client
                                                              auth0-public-client))
                                            (keycloak/claimed-roles claims)
                                            (set (map auth0/path->role
                                                      (:path-groups (p/user authorizer
                                                                            tenant
                                                                            (get claims "email"))))))
                              :jwt-token token))
              (handler req))
            (catch ParseException e
              (handler req)))
          (handler req))))))
