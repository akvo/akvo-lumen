(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
            ))

(defn endpoint [config]
  (routes
   (GET "/" []
        "Akvo Dash API")

   (GET "/people.csv" []
     {:status 200
      :headers {"Content-Type" "text/csv"}
      :body (slurp (clojure.java.io/resource
                    "org/akvo/dash/test/people.csv"))})))
