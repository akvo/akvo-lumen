(ns akvo.lumen.endpoint.export
  "Exposes the exporter proxy"
  (:require [akvo.lumen.lib.export :as export]
            [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]))

(s/def ::exporter-api-url string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.export/export [_]
  (s/keys :req-un [::exporter-api-url]))

(defn routes [{:keys [exporter-api-url] :as opts}]
  ["/exports"
   {:post {:responses {200 {}}
               :parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              headers :headers
                              body :body}]
                          (let [exporter-url (str exporter-api-url "/screenshot")]
                            (export/export exporter-url
                                           (get headers "authorization")
                                           (get jwt-claims "locale")
                                           body)))}}])

(defmethod ig/init-key :akvo.lumen.endpoint.export/export  [_ opts]
  (routes opts))

