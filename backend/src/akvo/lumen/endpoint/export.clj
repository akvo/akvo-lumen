(ns akvo.lumen.endpoint.export
  "Exposes the exporter proxy"
  (:require [akvo.lumen.lib.export :as export]
            [integrant.core :as ig]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]))

(defn endpoint [exporter-api-url ]
  (log/error :exporter-api-url exporter-api-url)
  (context "/api/exports" _
           (POST "/" {:keys [body jwt-claims headers]}
                 (let [exporter-url (str exporter-api-url "/screenshot")]
                   (export/export exporter-url
                                  (get headers "authorization")
                                  (get jwt-claims "locale")
                                  body)))))

(defmethod ig/init-key :akvo.lumen.endpoint.export/export  [_ {:keys [exporter-api-url]}]
  (endpoint exporter-api-url))

(s/def ::exporter-api-url string?)

(defmethod integrant-key :akvo.lumen.endpoint.export/export [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::exporter-api-url])))
