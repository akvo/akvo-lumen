(ns akvo.lumen.component.keycloak
  "Keycloak component."
  (:require [cheshire.core :as json]
            [com.stuartsierra.component :as component]
            [clj-http.client :as client]))


(defn fetch-openid-configuration
  "Get the openid configuration"
  [{:keys [keycloak-url keycloak-realm]}]
  (let [url (format "%s/realms/%s/.well-known/openid-configuration"
                    keycloak-url keycloak-realm)]
    (-> (client/get url) :body json/decode)))


(defrecord KeycloakAgent [config openid-config]

  component/Lifecycle
  (start [this]
    (println "@KeycloakAgent/start")
    (assoc this :openid-config (fetch-openid-configuration config)))

  (stop [this]
    (println "@KeycloakAgent/stop")
    this))

(defn keycloak [options]
  (map->KeycloakAgent {:config options}))
