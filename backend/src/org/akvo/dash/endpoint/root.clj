(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require
   [clojure.pprint :refer [pprint]]
   [clojure.data.csv :as csv]
   [compojure.core :refer :all]
   [org.akvo.dash.component.tenants :refer [connection]]))


(defn endpoint
  [{lord :lord :as config}]

  (GET "/" []
    (fn [{label :tenant-label :as req}]
      (let [db (connection lord label)]
        (println "Tenant label: " label)
        (str "Akvo Dash API (" label ")"))))

  (GET "/people.csv" []
    {:status  200
     :headers {"content-type" "application/csv"}
     :body    (slurp (clojure.java.io/resource
                      "org/akvo/dash/test/people.csv"))}))
