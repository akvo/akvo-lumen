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
  (context "/library" {:keys [params tenant] :as request}

    (GET "/" []
      (let [tenant-conn (connection tm tenant)]
        (response
         {:dashboards     []
          :datasets       (all-datasets tenant-conn)
          :visualisations (all-visualisations tenant-conn {} {} :identifiers identity)})))))
