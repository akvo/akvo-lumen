(ns akvo.lumen.endpoint.env
  (:require [integrant.core :as ig]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [ring.util.response :refer [response]]))

(defn handler [{:keys [keycloak-public-client-id keycloak-url flow-api-url
                        piwik-site-id sentry-client-dsn] :as opts}]
  (fn [{tenant :tenant :as request}]
    (response
        (cond-> {"keycloakClient" keycloak-public-client-id
                 "keycloakURL" keycloak-url
                 "flowApiUrl" flow-api-url
                 "piwikSiteId" piwik-site-id
                 "tenant" (:tenant request)}
          (string? sentry-client-dsn)
          (assoc "sentryDSN" sentry-client-dsn)))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/env"
   {:get {:handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.env/env  [_ opts]
  (routes opts))

(s/def ::keycloak-public-client-id string?)
(s/def ::keycloak-url string?)
(s/def ::flow-api-url string?)
(s/def ::sentry-client-dsn string?)
(s/def ::piwik-site-id string?)

(defmethod integrant-key :akvo.lumen.endpoint.env/env [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::keycloak-public-client-id
                                  ::keycloak-url
                                  ::flow-api-url
                                  ::sentry-client-dsn
                                  ::piwik-site-id])))
