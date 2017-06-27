(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.http :as http]
            [akvo.lumen.lib.user :as user]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [emailer keycloak tenant-manager]}]
  (context "/api/admin/invites" {:keys [jwt-claims params server-name tenant]}

    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (user/invites tenant-conn))

      (POST "/" {{:strs [email]} :body}
        (user/invite emailer keycloak tenant-conn tenant server-name email
                     jwt-claims))

      (context "/:id" [id]

        (DELETE "/" _
          (user/delete-invite tenant-conn id))))))

(defn verify-endpoint [{:keys [keycloak tenant-manager]}]
  (context "/verify" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (user/verify-invite keycloak tenant-conn tenant id)))))
