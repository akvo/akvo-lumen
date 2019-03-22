(ns akvo.lumen.endpoint.library
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.component.flow :as c.flow]
            [akvo.lumen.lib
             [dashboard :as dashboard]
             [visualisation :as visualisation]
             [collection :as collection]
             [raster :as raster]]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.commons.jwt :as jwt]
            [integrant.core :as ig]))

(defn handler [{:keys [tenant-manager flow-api] :as opts}]
  (fn [{tenant :tenant
        auth-datasets :auth-datasets
        :as request}]
    (let [tenant-conn (p/connection tenant-manager tenant)]
      (lib/ok
         {:dashboards (variant/value (dashboard/all tenant-conn))
          :datasets (variant/value (dataset/all tenant-conn flow-api auth-datasets))
          :rasters (variant/value (raster/all tenant-conn))
          :visualisations (variant/value (visualisation/all tenant-conn auth-datasets))
          :collections (variant/value (collection/all tenant-conn))}))))

(s/def ::flow-api :akvo.lumen.component.flow/config)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.library/library [_]
  (s/keys :req-un [::tenant-manager/tenant-manager ::flow-api] ))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/library"
   {:get {:responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.library/library  [_ opts]
  (routes opts))

