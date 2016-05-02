(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require [compojure.core :refer :all]
            [ring.util.response :refer [response]]))


(defn endpoint
  [config]

  (GET "/" []
    (fn [request]
      (let [base-url (str (-> request :scheme name)
                          "://" (:server-name request)
                          ":" (:server-port request)
                          (:uri request))]
        (response
         {:tenant (:tenant request)
          :resources {:datasets       (str base-url "datasets")
                      :visualisations (str base-url "visualisations")}})))))
