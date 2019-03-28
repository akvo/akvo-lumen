(ns akvo.lumen.endpoint.raster
  (:require [akvo.lumen.protocols :as p]
            [integrant.core :as ig]
            [akvo.lumen.lib.raster :as raster]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.upload :as upload]))

(s/def ::upload-config ::upload/config)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.raster/raster [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::upload-config] ))

(defn routes [{:keys [tenant-manager upload-config] :as opts}]
  ["/rasters"
   ["" {:get {:parameters {:body map?}
               :handler (fn [{tenant :tenant}]
                          (raster/all (p/connection tenant-manager tenant)))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              body :body}]
                          (raster/create (p/connection tenant-manager tenant) (:file-upload-path upload-config) jwt-claims body))}}]
   ["/:id" {:get {:parameters {:path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 {:keys [id]} :path-params}]
                             (raster/fetch (p/connection tenant-manager tenant) id))}
            :delete {:parameters {:path-params {:id string?}}
                     :handler (fn [{tenant :tenant
                                    {:keys [id]} :path-params}]
                              (raster/delete (p/connection tenant-manager tenant) id))}}]])

(defmethod ig/init-key :akvo.lumen.endpoint.raster/raster  [_ opts]
  (routes opts))
