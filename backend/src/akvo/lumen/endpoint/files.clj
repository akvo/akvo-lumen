(ns akvo.lumen.endpoint.files
  (:require [compojure.core :refer [ANY]]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [org.akvo.resumed :refer [make-handler]]))


(defn endpoint
  [{{:keys [file-upload-path max-upload-size]} :config}]
  (let [file-upload-handler (make-handler {:save-dir file-upload-path
                                           :max-upload-size max-upload-size})]
    (ANY "/api/files*" req
      (file-upload-handler req))))

(defmethod ig/init-key :akvo.lumen.endpoint.files  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.files :opts opts)
  endpoint)

(defmethod ig/halt-key! :akvo.lumen.endpoint.files  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.files opts))
