(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require
   [compojure.core :refer :all]
   [org.akvo.dash.endpoint.util :refer [rr]]))


(defn endpoint
  [config]

  (GET "/" []
    (fn [request]
      (let [base-url (str (-> request :scheme name)
                          "://" (:server-name request)
                          ":" (:server-port request)
                          (:uri request))]
        (rr {:tenant (:tenant request)
             :resources {:datasets       (str base-url "datasets")
                         :visualisations (str base-url "visualisations")}})))))
