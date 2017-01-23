(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [compojure.core :refer :all]
            [akvo.lumen.component.keycloak :as keycloak]))


(defn endpoint [{:keys [keycloak tenant-manager]}]
  (context "/api/invites" {:keys [jwt-claims params tenant] :as request}

    (let-routes [tenant-conn (connection tenant-manager tenant)
                 roles (get-in jwt-claims ["realm_access" "roles"])]
      (GET "/" _
        (keycloak/invites keycloak tenant roles tenant-conn))

      (POST "/" {:keys [body] :as request}
        (keycloak/invite keycloak tenant roles tenant-conn body)))))
