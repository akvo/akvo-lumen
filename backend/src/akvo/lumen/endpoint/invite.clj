(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.invite :as invite]
            [compojure.core :refer :all]

            [akvo.lumen.component.keycloak :as keycloak]))


(defn endpoint [{:keys [keycloak tenant-manager]}]
  (context "/api/invites" {:keys [jwt-claims params tenant] :as request}

    (let-routes [tenant-conn (connection tenant-manager tenant)
                 roles (get-in jwt-claims ["realm_access" "roles"])]
      (GET "/" _
        (invite/active-invites tenant tenant-conn keycloak roles))

      (POST "/" {:keys [body] :as request}
        (invite/create tenant-conn keycloak roles body jwt-claims)))))
