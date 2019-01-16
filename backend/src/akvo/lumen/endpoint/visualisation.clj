(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [config tenant-manager]}]

  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/" _
        (visualisation/all tenant-conn))

      (POST "/" {:keys [jwt-claims body]}
        (visualisation/create tenant-conn body jwt-claims))

      (POST "/maps/" {{:strs [spec]} :body}
            (let [layers (get-in spec ["layers"])]
              (maps/create tenant-conn (:windshaft-url config) layers)))
     
      (POST "/rasters/" {{:strs [rasterId spec]} :body}
            (maps/create-raster tenant-conn (:windshaft-url config) rasterId))

      (GET "/:id" [id]
           (visualisation/fetch tenant-conn id))

      (PUT "/:id" {:keys [jwt-claims body params]}
           (visualisation/upsert tenant-conn (assoc body "id" (:id params)) jwt-claims))

      (DELETE "/:id" [id]
              (visualisation/delete tenant-conn id)))))

(defmethod ig/init-key :akvo.lumen.endpoint.visualisation/visualisation  [_ opts]
  (endpoint (assoc opts :config (:config (:config opts)))))
