(ns akvo.lumen.endpoint.env
  (:require [compojure.core :refer :all]
            [ring.util.response :refer (response)]))

(defn endpoint [{:keys [config]}]
  (GET "/env" request
    (response {"keycloakClient" (:keycloak-public-client-id config)
               "keycloakURL" (:keycloak-url config)
               "tenant" (:tenant request)})))
