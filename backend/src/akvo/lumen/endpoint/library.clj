(ns akvo.lumen.endpoint.library
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.endpoint.dataset :as e.dataset]
            [akvo.lumen.endpoint.visualisation :as e.visualisation]
            [akvo.lumen.lib :as lib]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib
             [dashboard :as dashboard]
             [collection :as collection]
             [raster :as raster]]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn handler [{:keys [tenant-manager flow-api] :as opts}]
  (fn [{tenant :tenant
        auth-service :auth-service
        :as request}]
    (let [tenant-conn (p/connection tenant-manager tenant)]
      (lib/ok
         {:dashboards (variant/value (dashboard/all tenant-conn))
          :datasets (variant/value (e.dataset/all-datasets auth-service tenant-conn))
          :rasters (variant/value (raster/all tenant-conn))
          :visualisations (variant/value (e.visualisation/all-visualisations auth-service tenant-conn))
          :collections (variant/value (collection/all tenant-conn))}))))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.library/library [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/library"
   {:get {:responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.library/library  [_ opts]
  (routes opts))

