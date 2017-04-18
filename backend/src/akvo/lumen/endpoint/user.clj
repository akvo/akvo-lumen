(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.component.user-manager :as user-manager]
            [akvo.lumen.http :as http]
            [compojure.core :refer :all]))


(defn- promote-user? [body]
  (and (contains? body "admin")
       (= true (get body "admin"))))

(defn- demote-user? [body]
  (and (contains? body "admin")
       (not (get body "admin"))))

(defn endpoint [{:keys [user-manager]}]
  (context "/api/admin/users" {:keys [jwt-claims tenant]}

    (GET "/" _
      (user-manager/users user-manager tenant))

    (context "/:id" [id]

      (PATCH "/" {:keys [body]}
        (cond
          (demote-user? body)
          (user-manager/demote-user-from-admin user-manager tenant jwt-claims id)

          (promote-user? body)
          (user-manager/promote-user-to-admin user-manager tenant jwt-claims id)

          :else (http/not-implemented)))

      (DELETE "/" _
        (user-manager/remove-user user-manager tenant jwt-claims id)))))
