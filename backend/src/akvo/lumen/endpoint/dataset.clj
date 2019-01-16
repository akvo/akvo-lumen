(ns akvo.lumen.endpoint.dataset
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dataset :as dataset]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [config error-tracker tenant-manager]}]
  (context "/api/datasets" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/" _
        (dataset/all tenant-conn))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (dataset/create tenant-conn config error-tracker jwt-claims body))

      (GET "/:id" [id]
           (dataset/fetch tenant-conn id))

      (GET "/:id/meta" [id]
           (dataset/fetch-metadata tenant-conn id))

      (DELETE "/:id" [id]
              (dataset/delete tenant-conn id))

      (PUT "/:id" {:keys [body params]}
           (dataset/update-meta tenant-conn (:id params) body))

      (POST "/:id/update" {:keys [body params]}
            (dataset/update tenant-conn config error-tracker (:id params) body)))))

(defmethod ig/init-key :akvo.lumen.endpoint.dataset/dataset  [_ opts]
  (endpoint (assoc opts :config (:config (:config opts)))))
