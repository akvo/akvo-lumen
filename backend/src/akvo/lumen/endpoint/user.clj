(ns akvo.lumen.endpoint.user
  (:require [compojure.core :refer :all]
            [akvo.lumen.component.keycloak :as keycloak]))


(defn endpoint [{:keys [keycloak]}]
  (context "/api/admin/users" {:keys [jwt-claims tenant] :as request}

    (let-routes [roles (get-in jwt-claims ["realm_access" "roles"])]

      (GET "/" _
        (keycloak/users keycloak tenant)))))
