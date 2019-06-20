(ns akvo.lumen.endpoint.env
  (:require [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.keycloak]
            [akvo.lumen.component.auth0]
            [clojure.tools.logging :as log]
            [ring.util.response :as response]))

(s/def ::auth-type #{"keycloak" "auth0"})

(defn handler [{:keys [keycloak-public-client-id keycloak flow-api auth0
                        piwik-site-id sentry-client-dsn] :as opts}]
  (fn [{tenant :tenant
        query-params :query-params
        :as request}]
    (let [auth-type (get query-params "auth")
          auth-url (condp = auth-type
                     "keycloak" (:url keycloak)
                     "auth0" (:url auth0)
                     (:url keycloak))]
      (if (s/valid? ::auth-type auth-type)
        (response/response
         (cond-> {"keycloakClient" keycloak-public-client-id
                  "authURL" auth-url
                  "authProvider" auth-type
                  "flowApiUrl" (:url flow-api)
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

(s/def ::keycloak-public-client-id string?)
(s/def ::keycloak :akvo.lumen.component.keycloak/data)
(s/def ::auth0 :akvo.lumen.component.auth0/data)
(s/def ::flow-api :akvo.lumen.component.flow/config)
(s/def ::sentry-client-dsn string?)
(s/def ::piwik-site-id string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.env/env [_]
  (s/keys :req-un [::keycloak-public-client-id
                   ::keycloak
                   ::auth0
                   ::flow-api
                   ::sentry-client-dsn
                   ::piwik-site-id]))
