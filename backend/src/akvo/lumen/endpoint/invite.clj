(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.http :as http]
            [akvo.lumen.lib.user :as user]
            [compojure.core :refer :all]))


(defn redirect-location
  "Unfortunately local development is done by running the api at port 3000
  and the client at 3030. To solve this we extend the config map with a
  root-redirect key."
  [tier {:keys [api-port client-port scheme] :as config} {:keys [server-name]}]
  (if (nil? config)
    (format "https://%s/" server-name)
    (condp = tier
      :client (format "%s://%s:%s" scheme server-name client-port)
      :api (format "%s://%s:%s" scheme server-name api-port))))

(defn endpoint [{:keys [config emailer keycloak tenant-manager]}]
  (context "/api/admin/invites" {:keys [jwt-claims params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (user/invites tenant-conn))

      (POST "/" {{:strs [email]} :body}
        (user/invite emailer keycloak tenant-conn tenant
                     (redirect-location :api (:root-redirect config) request)
                     email jwt-claims))

      (context "/:id" [id]
        (DELETE "/" _
          (user/delete-invite tenant-conn id))))))

(defn verify-endpoint [{:keys [config keycloak tenant-manager]}]
  (context "/verify" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (user/verify-invite keycloak tenant-conn tenant id
                            (redirect-location :client (:root-redirect config)
                                               request))))))
