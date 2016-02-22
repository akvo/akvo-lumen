(ns org.akvo.dash.endpoint.library
  "Library endpoint..."
  (:require
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [org.akvo.dash.endpoint.util :refer [rr]]))


(hugsql/def-db-fns "org/akvo/dash/endpoint/library.sql")


(defn endpoint
  "/Library

  / GET
  Returns the library."
  [{{db :spec} :db}]
  (context "/library" []

    (GET "/" []
      (fn [req]
        (rr {:datasets       (dataset-coll db)
             :visualisations []
             :dashboards     []})))))
