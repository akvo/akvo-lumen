(ns org.akvo.dash.component.http
  "Web server component that uses Immutant web."
  (:require [com.stuartsierra.component :as component]
            [immutant.web :as web]))


(defrecord ImmutantWebServer [app]
  component/Lifecycle

  (start [component]
    (if (:server component)
      component
      (let [options (-> component (dissoc :app))
            handler (:handler app)
            server (web/run
                     (fn [req] (handler req))
                     (assoc options :path "api"))]
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


(alter-meta! #'->ImmutantWebServer assoc :no-doc true)
(alter-meta! #'map->ImmutantWebServer assoc :no-doc true)
