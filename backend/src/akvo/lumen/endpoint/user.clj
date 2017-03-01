(ns akvo.lumen.endpoint.user
  (:require [compojure.core :refer :all]
            [akvo.lumen.component.user-manager :as user-manager]))


(defn endpoint [{:keys [user-manager]}]
  (context "/api/admin/users" {:keys [tenant]}

    (GET "/" _
      (user-manager/users user-manager tenant))))
