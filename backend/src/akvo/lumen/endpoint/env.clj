(ns akvo.lumen.endpoint.env
  (:require [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [ring.util.response :refer [response]]))

(defn handler [{:keys [keycloak-public-client-id keycloak flow-api
                        piwik-site-id sentry-client-dsn] :as opts}]
  (fn [{tenant :tenant :as request}]
    (response
     (cond-> {"authClientId" keycloak-public-client-id
              "authURL" (:url keycloak)
              "authProvider" "keycloak"
              "flowApiUrl" (:url flow-api)
              "piwikSiteId" piwik-site-id
              "tenant" (:tenant request)}
       (string? sentry-client-dsn)
       (assoc "sentryDSN" sentry-client-dsn)))))

(defn routes [{:keys [routes-opts] :as opts}]
  ["/env" (merge {:get {:handler (handler opts)}}
                 (when routes-opts routes-opts))])

(defmethod ig/init-key :akvo.lumen.endpoint.env/env  [_ opts]
  (routes opts))

(s/def ::keycloak-public-client-id string?)
(s/def ::keycloak :akvo.lumen.component.keycloak/data)
(s/def ::flow-api :akvo.lumen.component.flow/config)
(s/def ::sentry-client-dsn string?)
(s/def ::piwik-site-id string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.env/env [_]
  (s/keys :req-un [::keycloak-public-client-id
                   ::keycloak
                   ::flow-api
                   ::sentry-client-dsn
                   ::piwik-site-id]))
