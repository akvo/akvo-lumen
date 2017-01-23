(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            ;; [akvo.lumen.lib.user :as user]
            [compojure.core :refer :all]
            [akvo.lumen.component.keycloak :as keycloak]))


;; Each tenant will already have one admin user
;;
;; The following endpoints are required for an MVP:
;;
;; 1. List of users
;; 2. User invitation - admin form -> email containing link back to lumen backend
;; 3. Accept user invite - send back email to user and admin


(defn endpoint [{:keys [keycloak tenant-manager]}]
  (context "/api/users" {:keys [jwt-claims params tenant] :as request}

    (let-routes [roles (get-in jwt-claims ["realm_access" "roles"])]

      (GET "/" _
        (keycloak/users keycloak tenant roles)))))


;; (defn user-invitation-endpoint [{:keys [tenant-manger]}]
;;   (context "/api/user-invitation" {:keys [params tenant] :as request}

;;     (POST "/" {:keys [jwt-claims body]}
;;       (prn jwt-claims)
;;       (prn body)
;;       "Create invitation")

;;     (GET "/pending" _
;;       "List pending invitations")

;;     (context "/:token" [token]

;;       (GET "/" _
;;         (do
;;           (println "Create user")
;;           (prn token)
;;           "If valid token, create user")))))

;; (defn user-accept-invitation-endpoint [{:keys [tenant-manager]}]
;;   (context "/api/user-accept-invitation-endpoint" {:keys [params tenant] :as request}

;;      (GET "/" _
;;        (users/create! tenant (:email params)))))

