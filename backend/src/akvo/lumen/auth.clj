(ns akvo.lumen.auth
  (:require [akvo.commons.jwt :as jwt]
            [akvo.lumen.component.auth0 :as auth0]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [ring.util.response :as response])
  (:import com.nimbusds.jose.crypto.RSASSAVerifier
           java.text.ParseException))

(defn claimed-roles [jwt-claims]
  (set (get-in jwt-claims ["realm_access" "roles"])))

(defn tenant-user?
  [{:keys [tenant jwt-claims]} issuer]
  (or (contains? (claimed-roles jwt-claims)
                 (format "akvo:lumen:%s" tenant))
      (and (= issuer :auth0)
           (string/includes? (get jwt-claims "email") "@akvo.org"))))

(defn tenant-admin?
  [{:keys [tenant jwt-claims]} issuer]
  (or (contains? (claimed-roles jwt-claims)
                 (format "akvo:lumen:%s:admin" tenant))
      (and (= issuer :auth0)
           (string/includes? (get jwt-claims "email") "@akvo.org"))))

(defn admin-path? [{:keys [path-info]}]
  (string/starts-with? path-info "/api/admin/"))

(defn api-path? [{:keys [path-info]}]
  (string/starts-with? path-info "/api/"))

(defn- application-json-type
  "code taken from ring.middleware.json/wrap-json-response"
  [response & [options]]
  (let [json-response (update-in response [:body] json/generate-string options)]
    (if (contains? (:headers response) "Content-Type")
      json-response
      (response/content-type json-response "application/json; charset=utf-8"))))

(def not-authenticated
  (-> (response/response "Not authenticated")
      (response/status 401)
      application-json-type))

(def not-authorized
  (-> (response/response "Not authorized")
      (response/status 403)
      application-json-type))

(def service-unavailable
  (-> (response/response "Service Unavailable")
      (response/status 503)
      application-json-type))

(def internal-server-error
  (-> (response/response "Internal server errror")
      (response/status 500)
      application-json-type))

(defn api-authz?
  "Feature flag predicate function. Add trailing $auth to given_name to enable
  API authz"
  [{:strs [family_name] :as jwt-claims}]
  (and (some? family_name) (string/ends-with? family_name "$auth")))

(defn wrap-auth
  "Wrap authentication for API. Allow GET to root / and share urls at /s/<id>.
  If request don't contain claims return 401. If current dns label (tenant) is
  not in claimed roles return 403.
  Otherwiese grant access. This implies that access is on tenant level."
  [keycloak auth0-public-client]
  (fn [handler]
    (fn [{:keys [jwt-claims] :as request}]
      (let [issuer (condp = (get jwt-claims "iss")
                     (:issuer keycloak) :keycloak
                     (:issuer auth0-public-client) :auth0
                     :other)]
        (cond
          (nil? jwt-claims) not-authenticated
          (admin-path? request) (if (tenant-admin? request issuer)
                                  (handler request)
                                  not-authorized)
          (api-path? request) (if (tenant-user? request issuer)
                                (handler request)
                                not-authorized)
          :else not-authorized)))))

(defn wrap-jwt
  "Go get cert from Keycloak and feed it to wrap-jwt-claims. Keycloak url can
  be configured via the KEYCLOAK_URL env var."
  [keycloak auth0-public-client]
  (let [keycloak-verifier (RSASSAVerifier. (:rsa-key keycloak))
        auth0-verifier (RSASSAVerifier.  (:rsa-key auth0-public-client))]
    (fn [handler]
      (fn [req]
        (if-let [token (jwt/jwt-token req)]
          (try
            (if-let [claims (or (jwt/verified-claims token keycloak-verifier (:issuer keycloak) {})
                                (jwt/verified-claims token auth0-verifier (:issuer auth0-public-client) {}))]
              (handler (assoc req
                              :jwt-claims claims
                              :jwt-token token))
              (handler req))
            (catch ParseException e
              (handler req)))
          (handler req))))))

(defmethod ig/init-key :akvo.lumen.auth/wrap-auth  [_ {:keys [keycloak auth0-public-client]}]
  (wrap-auth keycloak auth0-public-client))

(s/def ::keycloak ::keycloak/data)
(s/def ::auth0-public-client ::auth0/public-client)

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-auth [_]
  (s/keys :req-un [::keycloak ::auth0-public-client]))

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt  [_ {:keys [keycloak auth0-public-client]}]
  (wrap-jwt keycloak auth0-public-client))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt [_]
  (s/keys :req-un [::keycloak ::auth0-public-client]))

(defn api-tenant-admin?
  [tenant allowed-paths]
  (contains? allowed-paths (str tenant "/admin")))

(defn api-tenant-member?
  [tenant allowed-paths]
  (or
   (api-tenant-admin? tenant allowed-paths)
   (contains? allowed-paths tenant)))

(defmethod ig/init-key :akvo.lumen.auth/wrap-api-authorization
  [_ {:keys [keycloak]}]
  (fn [handler]
    (fn [{:keys [jwt-claims tenant] :as request}]
      (if (api-authz? jwt-claims)
        (try
          (let [email (get jwt-claims "email")
                allowed-paths (delay (p/allowed-paths keycloak email))]
            (cond
              (nil? jwt-claims) not-authenticated
              (admin-path? request) (if (api-tenant-admin? tenant @allowed-paths)
                                      (handler request)
                                      not-authorized)
              (api-path? request) (if (api-tenant-member? tenant @allowed-paths)
                                    (handler request)
                                    not-authorized)
              :else not-authorized))
          (catch Exception e
            (let [wrap-info (fn [e v] (log/info (.getMessage e)) v)]
              (case (-> e ex-data :response-code)
                503 (wrap-info e service-unavailable)
                401 not-authorized
                (wrap-info e internal-server-error)))))
        (handler request)))))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-api-authorization [_]
  (s/keys :req-un [::keycloak/keycloak]))
