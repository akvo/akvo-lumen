(ns org.akvo.dash.endpoint.visualizations
  (:require [compojure.core :refer :all]))

(defn visualizations-endpoint [config]
  (routes
   (GET "/visualizations" [] "Visualizations")))
