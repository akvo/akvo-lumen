(ns org.akvo.lumen.endpoint.dataset
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.dataset :as dataset]))


(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/datasets" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (dataset/all tenant-conn))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (dataset/create tenant-conn config jwt-claims body))

      (context "/:id" [id]
        (GET "/" _
          (dataset/fetch tenant-conn id))

        (DELETE "/" _
          (dataset/delete tenant-conn id))))))
