(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [ring.util.response :refer (response)]))


(defn endpoint [{:keys [config]}]
  (GET "/env" request
    (response
     (cond-> {"keycloakClient" (:keycloak-public-client-id config)
              "keycloakURL" (:keycloak-url config)
              "flowApiUrl" (:flow-api-url config)
              "tenant" (:tenant request)}
       (string? (:sentry-client-dsn config))
       (assoc "sentryDSN" (:sentry-client-dsn config))))))
