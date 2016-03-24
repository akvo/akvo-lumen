(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [org.akvo.dash.component.tenants :refer [connection]]))


(defn endpoint [config]
  (routes
   (GET "/" []
     (fn [req]
       (let [db (connection (:lord config)
                            (:tenant-label req))]
         (pprint db)
         "Akvo Dash API")))))
