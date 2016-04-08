(ns org.akvo.dash.endpoint.library
  "Library endpoint..."
  (:require
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [org.akvo.dash.component.tenants :refer [connection]]
   [org.akvo.dash.endpoint.util :refer [rr]]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/library.sql")


(defn endpoint
  "/library

  / GET
  Return the library"
  [{lord :lord :as config}]
  (context "/library" []
      (routes
       (GET "/" []
         (fn [{label :tenant-label :as req}]
           (pprint lord)
           (pprint label)
           (let [db (connection lord label)]
             (rr {:datasets       (all-datasets db)
                  :visualisations [] ;;(all-visualisations db)
                  :dashboards     []})))))))
