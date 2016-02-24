(ns org.akvo.dash.endpoint.files
  (:require [compojure.core :refer [ANY]]
            [org.akvo.resumed :refer [make-handler]]))

(defn endpoint [config]
  (let [file-upload-handler (make-handler config)]
    (ANY "/files*" req (file-upload-handler req))))
