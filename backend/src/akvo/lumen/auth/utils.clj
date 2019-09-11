(ns akvo.lumen.auth.utils
  (:require [clojure.string :as string]
            [cheshire.core :as json]
            [ring.util.response :as response]))

(defn issuer-type
  [jwt-claims keycloak-public-client auth0-public-client]
  (condp = (get jwt-claims "iss")
    (:issuer keycloak-public-client) :keycloak
    (:issuer auth0-public-client) :auth0
    :other))

(defmulti api-authz?
  (fn [{:strs [iss] :as jwt-claims}]
    (cond
      (string/ends-with? iss "eu.auth0.com/") :auth0
      (or (= iss "https://kc.akvotest.org/auth/realms/akvo")
          (= iss "https://login.akvo.org/auth/realms/akvo")) :keycloak)))

#_(defmethod api-authz? :auth0
    [{:strs [email email_verified] :as jwt-claims}]
    (let [flag-path ["https://akvo.org/app_metadata" "lumen" "features"
                     "apiAuthz"]
          flag (get-in jwt-claims flag-path)]
      (and (and (some? flag) flag)
           (and (some? email_verified) email_verified)
           (and (some? email) (string/ends-with? email "@akvo.org")))))

(defmethod api-authz? :auth0
  [{:strs [email email_verified] :as jwt-claims}]
  true)

(defmethod api-authz? :keycloak
  [{:strs [email family_name]}]
  (and
   (and (some? family_name) (string/ends-with? family_name "$auth"))
   (and (some? email) (string/ends-with? email "@akvo.org"))))

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

(def internal-server-error
  (-> (response/response "Internal server error")
      (response/status 500)
      application-json-type))

(def service-unavailable
  (-> (response/response "Service Unavailable")
      (response/status 503)
      application-json-type))
