(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.http :as http]
            [akvo.lumen.lib.user :as user]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]))


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


(defmethod ig/init-key :akvo.lumen.endpoint.user  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.user :opts opts)
  endpoint)

(defmethod ig/halt-key! :akvo.lumen.endpoint.user  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.user opts))
