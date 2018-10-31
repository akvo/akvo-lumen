(ns akvo.lumen.component.http
  "Immutant web Duct component."
  (:require [integrant.core :as ig]
            [immutant.web :as web]))

(defmethod ig/init-key :akvo.lumen.component.http/http  [_ {:keys [config app] :as opts}]
  (let [this (assoc (-> config :http) :app app)]
    (if (:server this)
      this
      (assoc this :server (web/run
                            (-> this :app :handler)
                            (assoc {:host "0.0.0.0"}
                                   :port (:port this)))))))

(defmethod ig/halt-key! :akvo.lumen.component.http/http  [_ {:keys [server] :as opts}]
  (when server
    (web/stop server))
    (dissoc opts :server))
