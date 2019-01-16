(ns akvo.lumen.endpoint.collection
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.collection :as collection]            
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/collections" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/" _
        (collection/all tenant-conn))

      (POST "/" {:keys [body]}
        (collection/create tenant-conn body))

      (GET "/:id" [id]
           (collection/fetch tenant-conn id))

      (PUT "/:id" {:keys [body params]}
           (collection/update tenant-conn (:id params) body))

      (DELETE "/:id" [id]
              (collection/delete tenant-conn id)))))

(defmethod ig/init-key :akvo.lumen.endpoint.collection/collection  [_ opts]
  (endpoint opts))
