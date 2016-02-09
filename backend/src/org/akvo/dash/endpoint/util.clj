(ns org.akvo.dash.endpoint.util
  "WIP might not stay once we are further along."
  (:require [cheshire.core :as json]))

(defn render [body]
  "Tmp fn to render json response"
  {:status  200
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string body)})
