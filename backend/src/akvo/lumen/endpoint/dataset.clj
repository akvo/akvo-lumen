(ns akvo.lumen.endpoint.dataset
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.dataset :as dataset]
            [compojure.core :refer :all]))


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
          (dataset/delete tenant-conn id))

        (POST "/update" _
          (dataset/update tenant-conn config id))))))
