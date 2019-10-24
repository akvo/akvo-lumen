(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.authentication]
            [akvo.lumen.component.keycloak]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [akvo.lumen.specs :as lumen.s]
            [ring.util.response :as response]))



(s/def ::auth-type ::lumen.s/non-empty-string)

(defn handler
  [{:keys [public-client flow-api lumen-deployment-color lumen-deployment-environment
           lumen-deployment-version piwik-site-id sentry-client-dsn]}]
  (fn [{tenant :tenant
        :as request}]
    (let [{:keys [url client-id
                  domain-suffix endpoint-issuer-suffix
                  endpoint-authorization-suffix endpoint-userinfo-suffix
                  endpoint-endsession-suffix endpoint-jwksuri-suffix]} public-client]
      (response/response
       (cond-> {"auth" {"clientId" client-id
                        "url" url
                        "domain" (str url domain-suffix)
                        "endpoints" {"issuer" endpoint-issuer-suffix
                                     "authorization" endpoint-authorization-suffix
                                     "userinfo" endpoint-userinfo-suffix
                                     "endSession" endpoint-endsession-suffix
                                     "jwksUri" endpoint-jwksuri-suffix}}
                "flowApiUrl" (:url flow-api)
                "lumenDeploymentColor" lumen-deployment-color
                "lumenDeploymentEnvironment" lumen-deployment-environment
                "lumenDeploymentVersion" lumen-deployment-version
                "piwikSiteId" piwik-site-id
                "tenant" (:tenant request)}
         (string? sentry-client-dsn)
         (assoc "sentryDSN" sentry-client-dsn))))))

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
