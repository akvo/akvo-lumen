(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [org.akvo.dash.component.tenants :refer [connection]]))


(defn endpoint
  [{lord :lord :as config}]
  (routes
   (GET "/" []
     (fn [{label :tenant-label :as req}]
       (let [db (connection lord label)]
         (println "Tenant label: " label)
         (str "Akvo Dash API (" label ")"))))))
