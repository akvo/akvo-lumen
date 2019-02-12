(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.endpoint.commons.http :as http]
            [akvo.lumen.lib.user :as user]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.keycloak :as keycloak]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn- promote-user? [body]
  (and (contains? body "admin")
       (= true (get body "admin"))))

(defn- demote-user? [body]
  (and (contains? body "admin")
       (not (get body "admin"))))

(defn endpoint [{:keys [keycloak]}]
  (context "/api/admin/users" {:keys [jwt-claims tenant]}

    (GET "/" _
      (user/users keycloak tenant))

    (context "/:id" [id]

      (PATCH "/" {:keys [body]}
        (cond
          (demote-user? body)
          (user/demote-user-from-admin keycloak tenant jwt-claims id)

          (promote-user? body)
          (user/promote-user-to-admin keycloak tenant jwt-claims id)

          :else (http/not-implemented)))

      (DELETE "/" _
        (user/remove-user keycloak tenant jwt-claims id)))))

(defmethod ig/init-key :akvo.lumen.endpoint.user/user  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.user/user [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::keycloak/keycloak])))
