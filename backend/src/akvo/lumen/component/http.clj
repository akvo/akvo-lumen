(ns akvo.lumen.component.http
  "Immutant web Duct component."
  (:require [integrant.core :as ig]
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
