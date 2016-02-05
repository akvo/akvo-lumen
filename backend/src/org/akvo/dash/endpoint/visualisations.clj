(ns org.akvo.dash.endpoint.visualisations
  (:require [compojure.core :refer :all]))

(defn visualisations-endpoint [config]
  (routes
   (GET "/visualisations" [] "Visualisations")))
