(ns org.akvo.dash.endpoint.library
  "Library endpoint..."
  (:require
   [camel-snake-kebab.core :refer [->kebab-case-keyword ->snake_case_string]]
   [cheshire.core :as json]
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [org.akvo.dash.endpoint.util :refer [rr]]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/library.sql")


(defn endpoint
  ""
  [{{db :spec} :db}]
  (context "/library" []

    (GET "/" []
      (fn [req]
        (rr {:datasets       (dataset-coll db)
             :visualisations []
             :dashboards     []})))))
