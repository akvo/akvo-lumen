(ns akvo.lumen.endpoint.env
  (:require [compojure.core :refer :all]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [ring.util.response :refer [response]]))

(defn endpoint [{:keys [config]}]
  (let [config (:config config)]
    (GET "/env" request
         (response
          (cond-> {"keycloakClient" (:keycloak-public-client-id config)
                   "keycloakURL" (:keycloak-url config)
                   "flowApiUrl" (:flow-api-url config)
                   "piwikSiteId" (:piwik-site-id config)
                   "tenant" (:tenant request)}
            (string? (:sentry-client-dsn config))
            (assoc "sentryDSN" (:sentry-client-dsn config)))))))

(defmethod ig/init-key :akvo.lumen.endpoint.env/env  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.env :opts opts)
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.env/env  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.env opts))
