(ns org.akvo.lumen.endpoint.library
  "Library endpoint..."
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [response]]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]))

(hugsql/def-db-fns "org/akvo/lumen/endpoint/dataset.sql")
(hugsql/def-db-fns "org/akvo/lumen/endpoint/dashboard.sql")
(hugsql/def-db-fns "org/akvo/lumen/endpoint/visualisation.sql")


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/library" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response
         {:dashboards     (all-dashboards tenant-conn)
          :datasets       (all-datasets tenant-conn)
          :visualisations (all-visualisations
                           tenant-conn {} {} :identifiers identity)})))))
