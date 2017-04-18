(ns akvo.lumen.endpoint.env
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [ring.util.response :refer (response)]))


(hugsql/def-db-fns "akvo/lumen/endpoint/env.sql")


(defn plan [tenant-conn]
  (let [resp (select-plan tenant-conn)]
    (if (nil? resp)
      "Planless"
      (:title resp))))

(defn endpoint [{:keys [config tenant-manager]}]
  (GET "/env" {:keys [tenant] :as request}
    (let [tenant-conn (connection tenant-manager tenant)]
      (response
       (cond-> {"keycloakClient" (:keycloak-public-client-id config)
                "keycloakURL" (:keycloak-url config)
                "tenant" tenant
                "plan" (plan tenant-conn)}
         (string? (:sentry-client-dsn config))
         (assoc "sentryDSN" (:sentry-client-dsn config)))))))
