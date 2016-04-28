(ns org.akvo.dash.endpoint.files
  (:require [compojure.core :refer [ANY]]
            [org.akvo.resumed :refer [make-handler]]))

(defn endpoint [{{:keys [file-upload-path]} :config}]
  (let [file-upload-handler (make-handler {:save-dir file-upload-path})]
    (ANY "/files*" req (file-upload-handler req))))
