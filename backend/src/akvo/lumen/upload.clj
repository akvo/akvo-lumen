(ns akvo.lumen.upload
  (:require [clojure.spec.alpha :as s]
            [integrant.core :as ig]))


(defmethod ig/init-key :akvo.lumen.upload/data  [_ opts]
  opts)

(s/def ::file-upload-path string?)
(s/def ::max-upload-size pos-int?)

(s/def ::config (s/keys :req-un [::file-upload-path
                                  ::max-upload-size]))

(defmethod ig/pre-init-spec :akvo.lumen.upload/data [_]
  ::config)
