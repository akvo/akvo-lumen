(ns org.akvo.dash.endpoint.root
  (:require [compojure.core :refer :all]))

(defn root-endpoint [config]
  (routes
   (GET "/" [] "Akvo Dash API")))
