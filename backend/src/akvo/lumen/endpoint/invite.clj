(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.user :as user]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn location
  ""
  [{:keys [client-port scheme] :as config} {:keys [server-name]}]
  (if (nil? config)
    (format "https://%s" server-name)
    (format "%s://%s:%s" (name scheme) server-name client-port)))

(defn endpoint [{:keys [config emailer keycloak tenant-manager]}]
  (context "/api/admin/invites" {:keys [jwt-claims params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (user/active-invites tenant-conn))

      (POST "/" {{:strs [email]} :body}
        (user/create-invite emailer keycloak tenant-conn tenant
                            (location (:invite-redirect config) request)
                            email jwt-claims))

      (context "/:id" [id]
        (DELETE "/" _
          (user/delete-invite tenant-conn id))))))

(defn verify-endpoint [{:keys [config keycloak tenant-manager]}]
  (context "/verify" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (user/verify-invite keycloak tenant-conn tenant id
                            (location (:invite-redirect config) request))))))

(defmethod ig/init-key :akvo.lumen.endpoint.invite/invite  [_ opts]
  (endpoint (assoc opts :config (:config (:config opts)))))

(defmethod ig/init-key :akvo.lumen.endpoint.invite/verify  [_ opts]
  (verify-endpoint (assoc opts :config (:config (:config opts)))))
