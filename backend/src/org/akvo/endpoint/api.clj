(ns org.akvo.endpoint.api
  (:require [cheshire.core :as json]
            [compojure.core :refer :all]
            [ring.util.response :refer [redirect]]))

(defn imports
  "Resource that will list imports"
  [req config]
  {:status 200
   :headers {"content-type" "application/json"}
   :body (json/generate-string (if true ;; pending
                                 {:status   :pending
                                  :progress "77%"}
                                 {:status     :done
                                  :dataset-id 1}))})

(def root-body
  "Static links to resources."
  "<html><body><ul>
  <li><a href='/api/v1/collections'>Collections</a></li>
  <li><a href='/api/v1/dashboards'>Dashboards</a></li>
  <li><a href='/api/v1/datasets'>Datasets</a></li>
  <li><a href='/api/v1/library'>Library</a></li>
  <li><a href='/api/v1/visualizations'>Visualizations</a></li>
  </ul></body></html>")

(defn root
  "List of resources."
  [req config]
  {:status  200
   :headers {"content-type" "text/html"}
   :body root-body})

(defn collections
  "List all entities in a dataset"
  [req config]
  {:status  200
   :headers {"content-type" "text/plain"}
   :body    "Visualizations"})

(defn dashboards
  "List all entities in a dataset"
  [req config]
  {:status  200
   :headers {"content-type" "text/plain"}
   :body    "Dashboards"})

(defn datasets
  "List all entities in a dataset"
  [req config]
  {:status  200
   :headers {"content-type" "text/plain"}
   :body    (json/generate-string {:meta {:key "value"}
                                   :dataset [{:id 1} {:id 2}]})})

(defn library
  "List all entities in a library"
  [req config]
  {:status  200
   :headers {"content-type" "text/plain"}
   :body    "Library"})

(defn visualizations
  "List all entities in a dataset"
  [req config]
  {:status  200
   :headers {"content-type" "text/plain"}
   :body    "Visualizations"})

(defn api-v1-routes
  ""
  [config]
  (context "/v1" []
           (GET "/" req (root req config))
           (GET "/collections" req (collections req config))
           (GET "/dashboards" req (dashboards req config))
           (GET "/datasets" req (datasets req config))
           (GET "/imports" req (imports req config))
           (GET "/library" req (library req config))
           (GET "/visualizations" req (visualizations req config))))

(defn api-endpoint
  ""
  [config]
  (context "/api" []
           (GET "/" []
                (redirect "/api/v1"))
           (api-v1-routes config)))
