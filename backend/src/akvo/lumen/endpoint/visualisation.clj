(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [config tenant-manager]}]

  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (visualisation/all tenant-conn))

      (POST "/" {:keys [jwt-claims body]}
        (visualisation/create tenant-conn body jwt-claims))

      (context "/maps" _
        (POST "/" {{:strs [datasetId spec]} :body}
          (let [layer (get-in spec ["layers" 0])]
            (maps/create tenant-conn (:windshaft-url config) datasetId layer))))

      (context "/rasters" _
        (POST "/" {{:strs [rasterId spec]} :body}
          (maps/create-raster tenant-conn (:windshaft-url config) rasterId)))

      (context "/:id" [id]

        (GET "/" _
          (visualisation/fetch tenant-conn id))

        (PUT "/" {:keys [jwt-claims body]}
          (visualisation/upsert tenant-conn (assoc body "id" id) jwt-claims))

        (DELETE "/" _
          (visualisation/delete tenant-conn id))))))
