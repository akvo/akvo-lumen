(ns org.akvo.component.http
  (:require [com.stuartsierra.component :as component]
            [immutant.web :as web]))


(defrecord ImmutantWebServer [app]
  component/Lifecycle

  (start [component]
    (if (:server component)
      component
      (let [options (-> component (dissoc :app))
            handler (atom (delay (:handler app)))
            server (web/run (fn [req]
                              (@@handler req)) options)]
        (assoc component
               :server server
               :handler handler))))

  (stop [component]
    (if-let [server (:server component)]
      (do
        (web/stop server)
        (dissoc component :server :handler))
      component)))

(defn immutant-web
  ""
  [options]
  (map->ImmutantWebServer options))
