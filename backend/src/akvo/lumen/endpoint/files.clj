(ns akvo.lumen.endpoint.files
  (:require [compojure.core :refer [ANY]]
            [integrant.core :as ig]
            [org.akvo.resumed :refer [make-handler]]))

(defn endpoint
  [{{:keys [file-upload-path max-upload-size]} :config}]
  (let [file-upload-handler (make-handler {:save-dir        file-upload-path
                                           :max-upload-size max-upload-size})]
    (ANY "/api/files*" req
         (file-upload-handler req))))

(defmethod ig/init-key :akvo.lumen.endpoint.files/files  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.files/files  [_ opts])
