(ns akvo.lumen.endpoint.raster
  (:require [akvo.lumen.protocols :as p]
            [integrant.core :as ig]
            [akvo.lumen.lib.raster :as raster]
            [akvo.lumen.specs.components :refer (integrant-key)]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.upload :as upload]
            [compojure.core :refer :all]))

(defn endpoint [tenant-manager file-upload-path]
  (context "/api/rasters" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/" _
        (raster/all tenant-conn))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (raster/create tenant-conn file-upload-path jwt-claims body))

      (context "/:id" [id]
        (GET "/" _
          (raster/fetch tenant-conn id))

        (DELETE "/" _
          (raster/delete tenant-conn id))))))

(defmethod ig/init-key :akvo.lumen.endpoint.raster/raster  [_ opts]
  (endpoint (-> opts :tenant-manager) (-> opts :upload-config :file-upload-path)))

(s/def ::upload-config ::upload/config)

(defmethod integrant-key :akvo.lumen.endpoint.raster/raster [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::upload-config] )))
