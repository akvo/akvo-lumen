(ns akvo.lumen.endpoint.library
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib
             [dashboard :as dashboard]
             [visualisation :as visualisation]
             [collection :as collection]
             [raster :as raster]]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/library" {:keys [tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (GET "/" _
        (lib/ok
         {:dashboards (variant/value (dashboard/all tenant-conn))
          :datasets (variant/value (dataset/all tenant-conn))
          :rasters (variant/value (raster/all tenant-conn))
          :visualisations (variant/value (visualisation/all tenant-conn))
          :collections (variant/value (collection/all tenant-conn))})))))

(defmethod ig/init-key :akvo.lumen.endpoint.library/library  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.library/library [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
