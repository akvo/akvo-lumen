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

(declare tenant-admin?)

(defn tenant-user?
  [{:keys [tenant jwt-claims auth-roles] :as data} issuer]
  (or (tenant-admin? data issuer)
      (contains? auth-roles
                 (format "akvo:lumen:%s" tenant))))

(defn tenant-admin?
  [{:keys [tenant jwt-claims auth-roles]} issuer]
  (contains? auth-roles
             (format "akvo:lumen:%s:admin" tenant)))

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

(defn api-authz? [{:strs [email email_verified] :as jwt-claims}]
  (let [flag-path ["https://akvo.org/app_metadata" "lumen" "features"
                   "apiAuthz"]
        flag (get-in jwt-claims flag-path)]
    (and (and (some? flag) flag)
         (and (some? email_verified) email_verified)
         (and (some? email) (string/ends-with? email "@akvo.org")))))

(defn issuer-type [jwt-claims keycloak-public-client auth0-public-client]
  (condp = (get jwt-claims "iss")
    (:issuer keycloak-public-client) :keycloak
    (:issuer auth0-public-client) :auth0
    :other))

(defn wrap-jwt-authorization
  "Wrap authorization for the API via JWT claims as:
  - No claims -> Not authenticated.
  - Request to admin path -> needs admin role on current tenant.
  - Request to api path -> needs to be member role on current tenant.
  - Otherwise not authorized."
  [keycloak-public-client auth0-public-client]
  (fn [handler]
    (fn [{:keys [jwt-claims] :as request}]
      (if (api-authz? jwt-claims)
        (handler request)
        (let [issuer (issuer-type jwt-claims keycloak-public-client auth0-public-client)]
          (cond
            (nil? jwt-claims) not-authenticated
            (admin-path? request) (if (tenant-admin? request issuer)
                                    (handler request)
                                    not-authorized)
            (api-path? request) (if (tenant-user? request issuer)
                                  (handler request)
                                  not-authorized)
            :else not-authorized))))))

(defn wrap-jwt-authentication
  "Go get cert from Keycloak and feed it to wrap-jwt-claims. Keycloak url can
  be configured via the KEYCLOAK_URL env var."
  [keycloak-public-client auth0-public-client authorizer]
  (let [keycloak-verifier (RSASSAVerifier. (:rsa-key keycloak-public-client))
        auth0-verifier (RSASSAVerifier.  (:rsa-key auth0-public-client))]
    (fn [handler]
      (fn [{:keys [tenant] :as req}]
        (if-let [token (jwt/jwt-token req)]
          (try
            (if-let [claims (or (jwt/verified-claims token keycloak-verifier (:issuer keycloak-public-client) {})
                                (jwt/verified-claims token auth0-verifier (:issuer auth0-public-client) {}))]
              (handler (assoc req
                              :jwt-claims claims
                              :auth-roles (if (= :keycloak (issuer-type claims keycloak-public-client auth0-public-client))
                                            (keycloak/claimed-roles claims)
                                            (set (map
                                                  auth0/path->role
                                                  (:path-groups (p/user authorizer tenant (get claims "email"))))))
                              :jwt-token token))
              (handler req))
            (catch ParseException e
              (handler req)))
          (handler req))))))

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt-authorization  [_ {:keys [keycloak-public-client auth0-public-client]}]
  (wrap-jwt-authorization keycloak-public-client auth0-public-client))

(s/def ::keycloak-public-client ::keycloak/public-client)
(s/def ::auth0-public-client ::auth0/public-client)

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt-authorization [_]
  (s/keys :req-un [::keycloak-public-client ::auth0-public-client]))

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt-authentication  [_ {:keys [keycloak-public-client auth0-public-client authorizer]}]
  (wrap-jwt-authentication keycloak-public-client auth0-public-client authorizer))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt-authentication [_]
  (s/keys :req-un [::keycloak-public-client ::auth0-public-client ::p/authorizer]))

(defn api-tenant-admin?
  [tenant allowed-paths]
  (contains? allowed-paths (str tenant "/admin")))

(defn api-tenant-member?
  [tenant allowed-paths]
  (or
   (api-tenant-admin? tenant allowed-paths)
   (contains? allowed-paths tenant)))

(defmethod ig/init-key :akvo.lumen.auth/wrap-api-authorization
  [_ {:keys [authorizer]}]
  (fn [handler]
    (fn [{:keys [jwt-claims tenant] :as request}]
      (if (api-authz? jwt-claims)
        (try
          (let [email (get jwt-claims "email")
                allowed-paths (delay (p/allowed-paths authorizer email))]
            (cond
              (nil? jwt-claims) not-authorized
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
  (s/keys :req-un [::p/authorizer]))
