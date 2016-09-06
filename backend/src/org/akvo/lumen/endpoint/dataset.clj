(ns org.akvo.lumen.endpoint.dataset
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.dataset :as d]
            [ring.util.response :refer [not-found response]]))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/datasets" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (d/all-datasets tenant-conn)))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (d/new-dataset tenant-conn config jwt-claims body))

      (context "/:id" [id]
        (GET "/" _
          (if-let [dataset (d/dataset tenant-conn id)]
            (response dataset)
            (not-found {:id id})))

        (DELETE "/" _
          (d/delete-dataset tenant-conn id)
          (response {:id id}))))))
