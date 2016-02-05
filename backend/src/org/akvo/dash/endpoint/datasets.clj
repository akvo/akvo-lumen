(ns org.akvo.dash.endpoint.datasets
  (:require [compojure.core :refer :all]))

(defn datasets-endpoint [config]
  (routes
   (GET "/datasets" [] "Datasets")))
