(ns org.akvo.lumen.endpoint.visualisation
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.visualisation :as visualisation]
            [ring.util.response :refer [not-found response]]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (visualisation/all tenant-conn)))

      (POST "/" {:keys [jwt-claims body]}
        (response (visualisation/create tenant-conn body jwt-claims)))

      (context "/:id" [id]

        (GET "/" _
          (let [v (visualisation/fetch tenant-conn id)]
            (if v
              (response v)
              (not-found {:error "not found"}))))

        (PUT "/" {:keys [jwt-claims body]}
          (response
           (visualisation/upsert tenant-conn (assoc body "id" id) jwt-claims)))

        (DELETE "/" _
          (let [r (visualisation/delete tenant-conn id)]
            (if r
              (response r)
              (not-found {:error "not found"}))))))))
