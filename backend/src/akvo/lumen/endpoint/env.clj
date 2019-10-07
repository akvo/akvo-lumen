(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.auth0]
            [akvo.lumen.component.keycloak]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [ring.util.response :as response]))

(s/def ::auth-type #{"keycloak" "auth0"})

(def auth-data (juxt :url :client-id))

(defn handler
  [{:keys [auth0-public-client flow-api keycloak-public-client
           lumen-deployment-color lumen-deployment-environment
           lumen-deployment-version piwik-site-id sentry-client-dsn]}]
  (fn [{tenant :tenant
        query-params :query-params
        :as request}]
    (let [auth-type (get query-params "auth" "auth0")
          [auth-url auth-client-id] (condp = auth-type
                                      "keycloak" (auth-data keycloak-public-client)
                                      "auth0" (auth-data auth0-public-client))]
      (if (s/valid? ::auth-type auth-type)
        (response/response
         (cond-> {"authClientId" auth-client-id
                  "authProvider" auth-type
                  "authURL" auth-url
                  "flowApiUrl" (condp = auth-type
                                 "keycloak" (:url flow-api)
                                 "auth0" (:auth0-url flow-api))
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
  ["/env" (merge {:get {:parameters {:query-params {:auth ::auth-type}}
                        :handler (handler opts)}}
                 (when routes-opts routes-opts))])

(defmethod ig/init-key :akvo.lumen.endpoint.env/env  [_ opts]
  (routes opts))

(s/def ::auth0-public-client :akvo.lumen.component.auth0/public-client)
(s/def ::flow-api :akvo.lumen.component.flow/config)
(s/def ::keycloak-public-client :akvo.lumen.component.keycloak/public-client)
(s/def ::lumen-deployment-color string?)
(s/def ::lumen-deployment-environment string?)
(s/def ::lumen-deployment-version string?)
(s/def ::piwik-site-id string?)
(s/def ::sentry-client-dsn string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.env/env [_]
  (s/keys :req-un [::auth0-public-client
                   ::flow-api
                   ::keycloak-public-client
                   ::lumen-deployment-color
                   ::lumen-deployment-environment
                   ::lumen-deployment-version
                   ::piwik-site-id
                   ::sentry-client-dsn]))
