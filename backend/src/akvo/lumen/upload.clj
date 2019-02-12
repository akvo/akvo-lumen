(ns akvo.lumen.upload
  (:require [clojure.spec.alpha :as s]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [integrant.core :as ig]))


(defmethod ig/init-key :akvo.lumen.upload/data  [_ opts]
  opts)

(s/def ::file-upload-path string?)
(s/def ::max-upload-size pos-int?)

(s/def ::config (s/keys :req-un [::file-upload-path
                                  ::max-upload-size]))

(defmethod integrant-key :akvo.lumen.upload/data [_]
  (s/cat :kw keyword?
         :config ::config))
