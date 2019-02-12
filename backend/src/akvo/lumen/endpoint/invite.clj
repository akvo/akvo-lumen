(ns akvo.lumen.endpoint.invite
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.user :as user]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.component.keycloak :as keycloak]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn location
  ""
  [{:keys [client-port scheme] :as config} {:keys [server-name]}]
  (if (nil? config)
    (format "https://%s" server-name)
    (format "%s://%s:%s" (name scheme) server-name client-port)))

(defn endpoint [{:keys [invite-redirect emailer keycloak tenant-manager]}]
  (context "/api/admin/invites" {:keys [jwt-claims params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/" _
        (user/active-invites tenant-conn))

      (POST "/" {{:strs [email]} :body}
        (user/create-invite emailer keycloak tenant-conn tenant
                            (location invite-redirect request)
                            email jwt-claims))

      (context "/:id" [id]
        (DELETE "/" _
          (user/delete-invite tenant-conn id))))))

(defn verify-endpoint [{:keys [invite-redirect keycloak tenant-manager]}]
  (context "/verify" {:keys [tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/:id" [id]
        (user/verify-invite keycloak tenant-conn tenant id
                            (location invite-redirect request))))))

(defmethod ig/init-key :akvo.lumen.endpoint.invite/invite  [_ opts]
  (endpoint opts))

(defmethod ig/init-key :akvo.lumen.endpoint.invite/verify  [_ opts]
  (verify-endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.invite/invite [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::keycloak/keycloak
                                  ::emailer/emailer])))

(defmethod integrant-key :akvo.lumen.endpoint.invite/verify [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::keycloak/keycloak])))
