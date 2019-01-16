(ns akvo.lumen.endpoint.dashboard
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dashboard :as dashboard]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/" _
        (dashboard/all tenant-conn))

      (POST "/" {:keys [body jwt-claims]}
        (dashboard/create tenant-conn body jwt-claims))

      (GET "/:id" [id]
           (dashboard/fetch tenant-conn id))

      (PUT "/:id" {:keys [body params]}
           (dashboard/upsert tenant-conn (:id params) body))

      (DELETE "/:id" [id]
              (dashboard/delete tenant-conn id)))))

(defmethod ig/init-key :akvo.lumen.endpoint.dashboard/dashboard  [_ opts]
  (endpoint opts))
