(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.authentication]
            [akvo.lumen.component.keycloak]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [akvo.lumen.specs :as lumen.s]
            [ring.util.response :as response]))

(def auth-data (juxt :url :client-id :issuer-suffix-url))

(s/def ::auth-type ::lumen.s/non-empty-string)

(defn handler
  [{:keys [public-client flow-api lumen-deployment-color lumen-deployment-environment
           lumen-deployment-version piwik-site-id sentry-client-dsn]}]
  (fn [{tenant :tenant
        :as request}]
    (let [[auth-url auth-client-id issuer-suffix-url] (auth-data public-client)]
      (response/response
       (cond-> {"auth" {"clientId" auth-client-id
                        "url" auth-url
                        "domain" (str auth-url "/realms/akvo")
                        "endpoints" {"issuer" "/"
                                     "authorization" "/protocol/openid-connect/auth"
                                     "userinfo" "/protocol/openid-connect/userinfo"
                                     "endSession" "/protocol/openid-connect/logout"
                                     "jwksUri" "/.well-known/openid-configuration"}}
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
