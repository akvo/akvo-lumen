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
            [akvo.lumen.specs.components :refer [integrant-key]]
            [ring.util.response :as response]))

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

(defn public-path? [{:keys [path-info request-method]}]
  (and (= :get request-method)
       (or (= "/api" path-info)
           (= "/env" path-info)
           (= "/healthz" path-info)
           (string/starts-with? path-info "/share/")
           (string/starts-with? path-info "/verify/"))))

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
      (public-path? request) (handler request)
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
  [{:keys [url realm]}]
  (fn [handler]
   (try
     (let [issuer (str url "/realms/" realm)
           certs  (-> (str issuer "/protocol/openid-connect/certs")
                      client/get
                      :body)]
       (jwt/wrap-jwt-claims handler (jwt/rsa-key certs 0) issuer))
     (catch Exception e
       (println "Could not get cert from Keycloak")
       (throw e)))))

(defmethod ig/init-key :akvo.lumen.auth/wrap-auth-prod  [_ opts]
  wrap-auth)

(defmethod integrant-key :akvo.lumen.auth/wrap-auth-prod [_]
  (s/cat :kw keyword?
         :config empty?))

(defmethod ig/init-key :akvo.lumen.auth/wrap-auth-mock  [_ opts]
  (fn [h]
    (fn [r]
      (h r))))

(defmethod integrant-key :akvo.lumen.auth/wrap-auth-mock [_]
  (s/cat :kw keyword?
         :config empty?))


(defmethod ig/init-key :akvo.lumen.auth/wrap-jwt  [_ {:keys [keycloak]}]
  (wrap-jwt keycloak))

(s/def ::keycloak ::keycloak/data)
(defmethod integrant-key :akvo.lumen.auth/wrap-jwt [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::keycloak] )))
