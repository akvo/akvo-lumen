(ns akvo.lumen.endpoint.dashboard
  (:require [compojure.core :refer :all]
            [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.dashboard :as dashboard]))


(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (dashboard/all tenant-conn))

      (POST "/" {:keys [body]}
        (dashboard/create tenant-conn body))

      (context "/:id" [id]

        (GET "/" _
          (dashboard/fetch tenant-conn id))

        (PUT "/" {:keys [body]}
          (dashboard/upsert tenant-conn id body))

        (DELETE "/" _
         (dashboard/delete tenant-conn id))))))
