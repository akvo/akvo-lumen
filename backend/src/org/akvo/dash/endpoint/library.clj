(ns org.akvo.dash.endpoint.library
  "Library endpoint..."
  (:require
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [org.akvo.dash.component.tenant-manager :refer [connection]]
   [org.akvo.dash.endpoint.util :refer [rr]]))


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
          (rr {:datasets       (all-datasets db)
               :visualisations (all-visualisations db)
               :dashboards     [] }))))))
