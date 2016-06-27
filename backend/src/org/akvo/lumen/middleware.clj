(ns org.akvo.lumen.middleware
  (:require [akvo.commons.jwt :as jwt]
            [clj-http.client :as client]
            [clojure.string :as s]
            [ring.util.response :as response])
  (:import [java.sql SQLException]))


(defn wrap-auth
  "Wrap authentication for API. Allow GET to root / and share urls at /s/<id>.
  If request don't contain claims return 401. If current dns label (tenant) is
  not in claimed roles return 403.
  Otherwiese grant access. This implies that access is on tenant level."
  [handler]
  (fn [request]
    (if (or
         (and (= "/api" (:path-info request))
              (= :get (:request-method request)))
         (and (s/starts-with? (:path-info request) "/s/" )
              (= :get (:request-method request))))
      (handler request)
      (if-let [claimed-roles (get-in request
                                     [:jwt-claims "realm_access" "roles"])]
        (if (contains? (set claimed-roles)
                       (str "akvo:lumen:" (:tenant request)))
          (handler request)
          (-> (response/response "Not authorized")
              (response/status 403)))
        (-> (response/response "Not authenticated")
            (response/status 401))))))


(defn wrap-jwt
  "Go get cert from Keycloak and feed it to wrap-jwt-claims. Keycloak url can
  be configured via the KEYCLOAK_URL env var."
  [handler issuer]
  (try
    (let [certs (-> (str issuer "/realms/akvo/protocol/openid-connect/certs")
                    client/get
                    :body)]
      (jwt/wrap-jwt-claims handler (jwt/rsa-key certs 0) issuer))
    (catch Exception e
      (.printStackTrace e)
      (when (isa? SQLException (type e))
        (.printStackTrace (.getNextException ^SQLException e))))))
