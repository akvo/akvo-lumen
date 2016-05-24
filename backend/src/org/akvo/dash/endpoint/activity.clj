(ns org.akvo.dash.endpoint.activity
  (:require [compojure.core :refer :all]
            [ring.util.response :refer [response]]))

(defn endpoint [{{db :spec} :db}]
  (context "/api/activities" []
    (GET "/" []
      (response {:activities []}))))
