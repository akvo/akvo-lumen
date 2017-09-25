(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (visualisation/all tenant-conn))

      (POST "/" {:keys [jwt-claims body]}
        (visualisation/create tenant-conn body jwt-claims))

      (context "/maps" _
        (POST "/" request
          (maps/create tenant-conn (:body request))))

      (context "/:id" [id]

        (GET "/" _
          (visualisation/fetch tenant-conn id))

        (PUT "/" {:keys [jwt-claims body]}
          (visualisation/upsert tenant-conn (assoc body "id" id) jwt-claims))

        (DELETE "/" _
          (visualisation/delete tenant-conn id))))))
