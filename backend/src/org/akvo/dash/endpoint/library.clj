(ns org.akvo.dash.endpoint.library
  "Library endpoint..."
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [response]]
            [org.akvo.dash.component.tenant-manager :refer [connection]]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/dataset.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")


(defn endpoint
  "/library

  / GET
  Return the library"
  [{tm :tenant-manager :as config}]
  (context "/library" []

    (GET "/" []
      (fn [{label :tenant :as request}]
        (let [db (connection tm label)]
          (response
           {:dashboards     []
            :datasets       (all-datasets db)
            :visualisations (all-visualisations db)}))))))
