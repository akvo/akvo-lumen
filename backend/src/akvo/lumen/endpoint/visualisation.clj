(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [config tenant-manager]}]

  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/" _
        (visualisation/all tenant-conn))

      (POST "/" {:keys [jwt-claims body]}
        (visualisation/create tenant-conn body jwt-claims))

      (context "/maps" _
        (POST "/" {{:strs [spec]} :body}
          (let [layers (get-in spec ["layers"])]
            (maps/create tenant-conn (:windshaft-url config) layers))))

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

(defmethod ig/init-key :akvo.lumen.endpoint.visualisation/visualisation  [_ opts]
  (endpoint opts))
