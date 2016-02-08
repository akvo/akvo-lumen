(ns org.akvo.dash.endpoint.visualisation
  (:require [compojure.core :refer :all]))

(defn endpoint [config]
  (routes
   (GET "/visualisations" [] "Visualisations")))
