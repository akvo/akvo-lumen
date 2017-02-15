(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.component.user-manager :as user-manager]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [tenant-manager user-manager]}]
  (context "/api/admin/invites" {:keys [jwt-claims params server-name tenant]}

    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (user-manager/invites user-manager tenant-conn))

      (POST "/" {{:strs [email]} :body}
        (user-manager/invite user-manager tenant-conn server-name email jwt-claims)))))

(defn verify-endpoint [{:keys [tenant-manager user-manager]}]
  (context "/verify" {:keys [tenant]}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (user-manager/verify-invite user-manager tenant-conn tenant id)))))
