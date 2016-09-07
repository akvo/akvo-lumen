(ns org.akvo.lumen.endpoint.dataset
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.dataset :as dataset]
            [ring.util.response :refer [not-found response]]))


(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/datasets" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (dataset/all tenant-conn)))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (response (dataset/create tenant-conn config jwt-claims body)))

      (context "/:id" [id]
        (GET "/" _
          (if-let [d (dataset/fetch tenant-conn id)]
            (response d)
            (not-found {:error "not found"})))

        (DELETE "/" _
          (if-let [r (dataset/delete tenant-conn id)]
            (response r)
            (not-found {:error "not found"})))))))
