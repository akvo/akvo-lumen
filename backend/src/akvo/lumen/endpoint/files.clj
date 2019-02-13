(ns akvo.lumen.endpoint.files
  (:require [compojure.core :refer [ANY]]
            [integrant.core :as ig]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [akvo.lumen.upload :as upload]
            [clojure.spec.alpha :as s]
            [org.akvo.resumed :refer [make-handler]]))

(defn endpoint
  [{:keys [file-upload-path max-upload-size]}]
  (let [file-upload-handler (make-handler {:save-dir        file-upload-path
                                           :max-upload-size max-upload-size})]
    (ANY "/api/files*" req
         (file-upload-handler req))))

(defmethod ig/init-key :akvo.lumen.endpoint.files/files  [_ opts]
  (endpoint (:upload-config opts)))


(s/def ::upload-config ::upload/config)

(defmethod integrant-key :akvo.lumen.endpoint.files/files [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::upload-config])))
