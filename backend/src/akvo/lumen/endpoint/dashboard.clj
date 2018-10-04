(ns akvo.lumen.endpoint.dashboard
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.dashboard :as dashboard]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (dashboard/all tenant-conn))

      (POST "/" {:keys [body jwt-claims]}
        (dashboard/create tenant-conn body jwt-claims))

      (context "/:id" [id]

        (GET "/" _
          (dashboard/fetch tenant-conn id))

        (PUT "/" {:keys [body]}
          (dashboard/upsert tenant-conn id body))

        (DELETE "/" _
         (dashboard/delete tenant-conn id))))))

(defmethod ig/init-key :akvo.lumen.endpoint.dashboard/dashboard  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.dashboard/dashboard  [_ opts])
