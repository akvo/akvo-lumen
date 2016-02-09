(ns org.akvo.dash.endpoint.root
  "The root (/) API resource."
  (:require [compojure.core :refer :all]))

(defn endpoint [config]
  (routes
   (GET "/" [] "Akvo Dash API")))
