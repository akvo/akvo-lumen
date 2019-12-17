(ns akvo.lumen.component.authz-service
  "We leverage Keycloak groups for tenant partition and admin roles.
   More info can be found in the Keycloak integration doc spec."
  (:require
    [akvo.lumen.http.client :as http.client]
    [clojure.spec.alpha :as s]
    [clojure.tools.logging :as log]
    [integrant.core :as ig]
    [ring.util.response :refer [response]]))

(def ^:dynamic http-client-req-defaults (http.client/req-opts 2000))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API Authorization
;;;

(defn check-permissions
  [{:keys [authz-service-url http-connection-manager headers-fn]} authz-credentials body]
  (let [headers (headers-fn authz-credentials)
        res (try
              (http.client/post*
                (str authz-service-url "/check_permissions")
                (merge http-client-req-defaults
                  {:as :json
                   :headers headers
                   :connection-manager http-connection-manager
                   :throw-entire-message? true
                   :unexceptional-status #(<= 200 % 299)
                   :form-params body
                   :content-type :json}))
              (catch Exception e
                (log/error e :fail :url authz-service-url :body body
                  :response (ex-data e))))]
    res))

(defmethod ig/init-key ::http-service-client [_ {:keys [url api-headers-fn]}]
  (log/debug "Starting authz-service client")
  {:http-connection-manager (http.client/new-connection-manager {:timeout 10 :threads 10 :default-per-route 10})
   :headers-fn api-headers-fn
   :authz-service-url url})

(defmethod ig/halt-key! ::http-service-client [_ opts]
  (log/debug :auth-service "closing connection manager" (:connection-manager opts))
  (http.client/shutdown-manager (:http-connection-manager opts)))

(s/def ::url string?)
(s/def ::api-headers-fn fn?)
(s/def ::config (s/keys :req-un [::url ::api-headers-fn]))

(defmethod ig/pre-init-spec ::http-service-client [_]
  ::config)

(defn >api-model [ds-source]
  (let [instance (get ds-source "instance")
        survey (get ds-source "surveyId")]
    {:instance_id instance
     :survey_id survey}))
