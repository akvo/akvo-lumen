(ns akvo.lumen.endpoint.env
  (:require [compojure.core :refer :all]
            [integrant.core :as ig]
            [ring.util.response :refer [response]]))

(defn endpoint [{:keys [keycloak-public-client-id keycloak-url flow-api-url
                        piwik-site-id sentry-client-dsn]}]
  (GET "/env" request
       (response
        (cond-> {"keycloakClient" keycloak-public-client-id
                 "keycloakURL" keycloak-url
                 "flowApiUrl" flow-api-url
                 "piwikSiteId" piwik-site-id
                 "tenant" (:tenant request)}
          (string? sentry-client-dsn)
          (assoc "sentryDSN" sentry-client-dsn)))))

(defmethod ig/init-key :akvo.lumen.endpoint.env/env  [_ opts]
  (endpoint opts))
