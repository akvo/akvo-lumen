(ns akvo.lumen.endpoint.library
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.dataset :as dataset]
            [akvo.lumen.lib
             [dashboard :as dashboard]
             [visualisation :as visualisation]
             [collection :as collection]
             [raster :as raster]]
            [akvo.lumen.variant :as variant]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/library" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (lib/ok
         {:dashboards (variant/value (dashboard/all tenant-conn))
          :datasets (variant/value (dataset/all tenant-conn))
          :rasters (variant/value (raster/all tenant-conn))
          :visualisations (variant/value (visualisation/all tenant-conn))
          :collections (variant/value (collection/all tenant-conn))})))))


(defmethod ig/init-key :akvo.lumen.endpoint.library  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.library :opts opts)
  endpoint)

(defmethod ig/halt-key! :akvo.lumen.endpoint.library  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.library opts))
