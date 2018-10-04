(ns akvo.lumen.endpoint.collection
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.collection :as collection]            
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/collections" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (collection/all tenant-conn))

      (POST "/" {:keys [body]}
        (collection/create tenant-conn body))

      (context "/:id" [id]

        (GET "/" _
          (collection/fetch tenant-conn id))

        (PUT "/" {:keys [body]}
          (collection/update tenant-conn id body))

        (DELETE "/" _
          (collection/delete tenant-conn id))))))

(defmethod ig/init-key :akvo.lumen.endpoint.collection/collection  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.collection/collection  [_ opts])
