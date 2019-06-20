(ns akvo.lumen.auth
  (:require [akvo.commons.jwt :as jwt]
            [akvo.lumen.component.auth0 :as auth0]
            [akvo.lumen.component.keycloak :as keycloak]
            [cheshire.core :as json]
            [clj-http.client :as client]
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

(def not-authenticated
  (-> (response/response "Not authenticated")
      (response/status 401)))

(def not-authorized
  (-> (response/response "Not authorized")
      (response/status 403)))

(def service-unavailable
  (-> (response/response "Service Unavailable")
      (response/status 503)))

(defn wrap-auth
  "Wrap authentication for API. Allow GET to root / and share urls at /s/<id>.
  If request don't contain claims return 401. If current dns label (tenant) is
  not in claimed roles return 403.
  Otherwiese grant access. This implies that access is on tenant level."
  [keycloak auth0]
  (fn [handler]
    (fn [{:keys [jwt-claims] :as request}]
      (let [issuer (condp = (get jwt-claims "iss")
                                   (:issuer keycloak) :keycloak
                                   (:issuer auth0) :auth0
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
  [keycloak auth0]
  (let [keycloak-verifier (RSASSAVerifier. (:rsa-key keycloak))
        auth0-verifier (RSASSAVerifier.  (:rsa-key auth0))]
    (fn [handler]
      (fn [req]
        (if-let [token (jwt/jwt-token req)]
          (try
            (if-let [claims (or (jwt/verified-claims token keycloak-verifier (:issuer keycloak) {})
                                (jwt/verified-claims token auth0-verifier (:issuer auth0) {}))]
              (handler (assoc req :jwt-claims claims))
              (handler req))
            (catch ParseException e
              (handler req)))
          (handler req))))))

(defmethod ig/init-key :akvo.lumen.auth/wrap-auth  [_ {:keys [keycloak auth0]}]
  (wrap-auth keycloak auth0))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-auth [_]
  (s/keys :req-un [::keycloak ::auth0]))

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt  [_ {:keys [keycloak auth0]}]
  (wrap-jwt keycloak auth0))

(s/def ::keycloak ::keycloak/data)
(s/def ::auht0 ::auth0/data)

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt [_]
  (s/keys :req-un [::keycloak ::auth0]))

(defn api-tenant-admin?
  [tenant allowed-paths]
  (contains? allowed-paths (str tenant "/admin")))

(defn api-tenant-member?
  [tenant allowed-paths]
  (or
   (contains? allowed-paths (str tenant "/admin"))
   (contains? allowed-paths tenant)))

(defmethod ig/init-key :akvo.lumen.auth/wrap-authorization
  [_ {:keys [keycloak]}]
  (fn [handler]
    (fn [{:keys [jwt-claims tenant] :as request}]
      (try
        (let [email (get jwt-claims "email")
              allowed-paths (keycloak/allowed-paths keycloak email)]

          (cond
            (nil? jwt-claims) not-authenticated
            (admin-path? request) (if (api-tenant-admin? tenant allowed-paths)
                                    (handler request)
                                    not-authorized)
            (api-path? request) (if (api-tenant-member? tenant allowed-paths)
                                  (handler request)
                                  not-authorized)
            :else not-authorized))
        (catch Exception e
          (log/info (.getMessage e))
          service-unavailable)))))

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-authorization [_]
  (s/keys :req-un [::keycloak/keycloak]))
