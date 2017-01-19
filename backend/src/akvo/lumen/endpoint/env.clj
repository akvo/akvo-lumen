(ns akvo.lumen.endpoint.env
  (:require [compojure.core :refer :all]
            [ring.util.response :refer (response)]))

(defn endpoint [{:keys [config]}]
  (GET "/env" _
    (response {"keycloakURL" (:keycloak-url config)})))
