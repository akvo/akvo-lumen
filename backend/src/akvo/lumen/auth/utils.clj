(ns akvo.lumen.auth.utils
  (:require [clojure.string :as string]
            [cheshire.core :as json]
            [ring.util.response :as response]))

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
