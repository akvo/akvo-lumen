(ns akvo.lumen.endpoint.user
  (:require [akvo.lumen.component.user-manager :as user-manager]
            [akvo.lumen.http :as http]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [user-manager]}]
  (context "/api/admin/users" {:keys [tenant]}

    (GET "/" _
      (user-manager/users user-manager tenant))

    (context "/:id" [id]

      (PATCH "/" _
        (http/not-implemented))

      (DELETE "/" _
        (http/not-implemented)))))
