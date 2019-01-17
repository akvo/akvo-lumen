(ns akvo.lumen.endpoint.files
  (:require [integrant.core :as ig]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [akvo.lumen.upload :as upload]
            [clojure.spec.alpha :as s]
            [org.akvo.resumed :refer [make-handler]]))

(defn routes [{:keys [upload-config]}]
  (let [{:keys [file-upload-path max-upload-size]} upload-config
        file-upload-handler                        (make-handler {:save-dir        file-upload-path
                                                                  :max-upload-size max-upload-size})
        data-handler                               {:handler (fn [req] (file-upload-handler req))}]
    ["/files" [["" {:post data-handler}]
               ["/:id" {:head  data-handler
                        :patch data-handler}]]]))

(defmethod ig/init-key :akvo.lumen.endpoint.files/files  [_ opts]
  (routes opts))

(s/def ::upload-config ::upload/config)

(defmethod integrant-key :akvo.lumen.endpoint.files/files [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::upload-config])))
