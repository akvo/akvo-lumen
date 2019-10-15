(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.authentication]
            [akvo.lumen.component.keycloak]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [ring.util.response :as response]))

(def auth-data (juxt :url :client-id))

(defn handler
  [{:keys [public-client flow-api lumen-deployment-color lumen-deployment-environment
           lumen-deployment-version piwik-site-id sentry-client-dsn]}]
  (fn [{tenant :tenant
        query-params :query-params
        :as request}]
    (let [auth-type (get query-params "auth" "auth0")
          [auth-url auth-client-id] (auth-data public-client)]
      (if (s/valid? ::auth-type auth-type)
        (response/response
         (cond-> {"authClientId" auth-client-id
                  "authURL" auth-url
                  "authProvider" auth-type
                  "flowApiUrl" (:url flow-api)
                  "lumenDeploymentColor" lumen-deployment-color
                  "lumenDeploymentEnvironment" lumen-deployment-environment
                  "lumenDeploymentVersion" lumen-deployment-version
                  "piwikSiteId" piwik-site-id
                  "tenant" (:tenant request)}
           (string? sentry-client-dsn)
           (assoc "sentryDSN" sentry-client-dsn)))
         (-> (response/response (str "Auth-provided not implemented: " auth-type))
            (response/status 400))))))

(defn routes [{:keys [routes-opts] :as opts}]
  ["/env" (merge {:get {:handler (handler opts)}}
                 (when routes-opts routes-opts))])

(defmethod ig/init-key :akvo.lumen.endpoint.env/env  [_ opts]
  (routes opts))

(s/def ::public-client :akvo.lumen.component.authentication/public-client)
(s/def ::flow-api :akvo.lumen.component.flow/config)
(s/def ::lumen-deployment-color string?)
(s/def ::lumen-deployment-environment string?)
(s/def ::lumen-deployment-version string?)
(s/def ::piwik-site-id string?)
(s/def ::sentry-client-dsn string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.env/env [_]
  (s/keys :req-un [::public-client
                   ::flow-api
                   ::lumen-deployment-color
                   ::lumen-deployment-environment
                   ::lumen-deployment-version
                   ::piwik-site-id
                   ::sentry-client-dsn]))
