(ns akvo.lumen.auth.jwt-authentication
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.protocols :as p])
  (:import
   com.nimbusds.jose.crypto.RSASSAVerifier
   java.text.ParseException))

(defn create-RSASSAVerifier
  [public-key]
  (RSASSAVerifier. public-key))

(def RSASSA-verifier (memoize create-RSASSAVerifier))

(defn jwt-authentication
  [handler {:keys [tenant] :as request}
   {:keys [public-client authorizer]}]
  (let [verifier (RSASSA-verifier (:rsa-key public-client))]
    (if-let [token (jwt/jwt-token request)]
      (try
        (if-let [claims (jwt/verified-claims token verifier (:issuer public-client) {})]
          (handler (assoc request :jwt-claims claims :jwt-token token))
          (handler request))
        (catch ParseException e
          (handler request)))
      (handler request))))
