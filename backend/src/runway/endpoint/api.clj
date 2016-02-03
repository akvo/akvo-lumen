(ns runway.endpoint.api
  (:require [compojure.core :refer :all]))

(defn api-endpoint [{{db :spec} :db}]
  (context "/api" []
           (GET "/" []
                {:status 200
                 :headers {"content-type" "application/json"}
                 :body "{'key': 'value'}"
                 }
                )
           )
  )
