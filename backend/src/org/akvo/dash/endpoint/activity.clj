(ns org.akvo.dash.endpoint.activity
  (:require [compojure.core :refer :all]
            [org.akvo.dash.endpoint.util :refer [rr]]))


(defn endpoint [{{db :spec} :db}]
  (context "/activities" []
    (GET "/" []
      (rr {:activities []}))))
