(ns akvo.lumen.endpoint.dataset
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.dataset :as dataset]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [config error-tracker tenant-manager]}]
  (context "/api/datasets" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (dataset/all tenant-conn))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (dataset/create tenant-conn config error-tracker jwt-claims body))

      (context "/:id" [id]
        (GET "/" _
          (dataset/fetch tenant-conn id))

        (GET "/meta" _
          (dataset/fetch-metadata tenant-conn id))

        (DELETE "/" _
          (dataset/delete tenant-conn id))

        (PUT "/" {:keys [body]}
          (dataset/update-meta tenant-conn id body))

        (POST "/update" {:keys [body] :as request}
          (dataset/update tenant-conn config id body))))))

(defmethod ig/init-key :akvo.lumen.endpoint.dataset/dataset  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.dataset/dataset  [_ opts])
