(ns akvo.lumen.component.http
  "Immutant web Duct component."
  (:require [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.handler :as handler]
            [immutant.web :as web]))

(defmethod ig/init-key :akvo.lumen.component.http/http  [_ {:keys [port handler] :as opts}]
  (if (:server opts)
    opts
    (assoc opts
           :server (web/run
                     (:handler handler)
                     (assoc {:host "0.0.0.0"}
                            :port port)))))

(defmethod ig/halt-key! :akvo.lumen.component.http/http  [_ {:keys [server] :as opts}]
  (when server
    (web/stop server))
    (dissoc opts :server))

(s/def ::port pos-int?)

(s/def ::handler (s/merge ::handler/config (s/keys :req-un [::handler/handler])))

(defmethod ig/pre-init-spec :akvo.lumen.component.http/http [_]
  (s/keys :req-un [::port ::handler]))
