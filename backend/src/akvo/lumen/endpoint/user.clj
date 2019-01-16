(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.endpoint.commons.http :as http]
            [akvo.lumen.lib.user :as user]
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

    (PATCH "/:id/" {:keys [body params]}
           (cond
             (demote-user? body)
             (user/demote-user-from-admin keycloak tenant jwt-claims (:id params))

             (promote-user? body)
             (user/promote-user-to-admin keycloak tenant jwt-claims (:id params))

             :else (http/not-implemented)))

    (DELETE "/:id/" [id]
            (user/remove-user keycloak tenant jwt-claims id))))

(defmethod ig/init-key :akvo.lumen.endpoint.user/user  [_ opts]
  (endpoint opts))
