(ns org.akvo.lumen.endpoint.library
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib
             [dashboard :as dashboard]
             [dataset :as dataset]
             [visualisation :as visualisation]]
            [ring.util.response :refer [response]]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/library" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response
         {:dashboards (dashboard/all-dashboards tenant-conn)
          :datasets (dataset/all-datasets tenant-conn)
          :visualisation (visualisation/all tenant-conn)})))))
