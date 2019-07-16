(ns akvo.lumen.auth
  (:require [akvo.commons.jwt :as jwt]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clj-http.client :as client]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.keycloak :as keycloak]
            [integrant.core :as ig]
            [ring.util.response :as response])
  (:import java.text.ParseException
           com.nimbusds.jose.crypto.RSASSAVerifier))

(defn claimed-roles [jwt-claims]
  (set (get-in jwt-claims ["realm_access" "roles"])))

(defn tenant-user?
  [{:keys [tenant jwt-claims]}]
  (contains? (claimed-roles jwt-claims)
             (format "akvo:lumen:%s" tenant)))

(defn tenant-admin?
  [{:keys [tenant jwt-claims]}]
  (contains? (claimed-roles jwt-claims)
             (format "akvo:lumen:%s:admin" tenant)))

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

(defn wrap-auth
  "Wrap authentication for API. Allow GET to root / and share urls at /s/<id>.
  If request don't contain claims return 401. If current dns label (tenant) is
  not in claimed roles return 403.
  Otherwiese grant access. This implies that access is on tenant level."
  [handler]
  (fn [{:keys [jwt-claims] :as request}]
    (cond
      (nil? jwt-claims) not-authenticated
      (admin-path? request) (if (tenant-admin? request)
                              (handler request)
                              not-authorized)
      (api-path? request) (if (tenant-user? request)
                            (handler request)
                            not-authorized)
      :else not-authorized)))

(defn wrap-jwt
  "Go get cert from Keycloak and feed it to wrap-jwt-claims. Keycloak url can
  be configured via the KEYCLOAK_URL env var."
  [keycloak]
  (fn [handler]
    (let [keycloak-verifier (RSASSAVerifier. (:rsa-key keycloak))]
    (fn [req]
      (if-let [token (jwt/jwt-token req)]
        (try
          (if-let [claims (jwt/verified-claims token keycloak-verifier (:issuer keycloak) {})]
            (handler (assoc req :jwt-claims claims))
            (handler req))
          (catch ParseException e
            (handler req)))
        (handler req))))))

(defmethod ig/init-key :akvo.lumen.auth/wrap-auth  [_ opts]
  wrap-auth)

(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-auth [_]
  empty?)

(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt  [_ {:keys [keycloak]}]
  (wrap-jwt keycloak))

(s/def ::keycloak ::keycloak/data)
(defmethod ig/pre-init-spec :akvo.lumen.auth/wrap-jwt [_]
  (s/keys :req-un [::keycloak]))
