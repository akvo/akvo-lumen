(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.authentication]
            [akvo.lumen.component.keycloak]
            [akvo.lumen.lib.env :as env]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs :as lumen.s]
            [ring.util.response :as response]))



(s/def ::auth-type ::lumen.s/non-empty-string)

(defn handler
  [{:keys [public-client flow-api lumen-deployment-color lumen-deployment-environment
           lumen-deployment-version piwik-site-id sentry-client-dsn
           tenant-manager]}]
  (fn [{tenant :tenant
        :as request}]
    (let [{:keys [url client-id end-session-endpoint-suffix open-id-config]} public-client]
      (response/response
       (if (get-in request [:jwt-claims "sub"])
         {"environment" (env/all (p/connection tenant-manager (:tenant request)))}
         (cond-> {"auth" {"clientId" client-id
                          "url" url
                          "domain" (:issuer open-id-config)
                          "endpoints" {"issuer" (:issuer open-id-config)
                                       "authorization" (:authorization_endpoint open-id-config)
                                       "userinfo" (:userinfo_endpoint open-id-config)
                                       "endSession" (:end_session_endpoint open-id-config (str (:issuer open-id-config) end-session-endpoint-suffix))
                                       "jwksUri" (:jwks_uri open-id-config)}}
                  "flowApiUrl" (:url flow-api)
                  "lumenDeploymentColor" lumen-deployment-color
                  "lumenDeploymentEnvironment" lumen-deployment-environment
                  "lumenDeploymentVersion" lumen-deployment-version
                  "piwikSiteId" piwik-site-id
                  "tenant" (:tenant request)}
           (string? sentry-client-dsn)
           (assoc "sentryDSN" sentry-client-dsn)))))))

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
